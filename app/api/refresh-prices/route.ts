import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePriceHistory } from '@/lib/priceHistory';
import { createHash } from 'crypto';

/** 中国时区 yyyy-MM-dd HH:mm:ss */
function getChinaTimestamp(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const china = new Date(utc + 8 * 60 * 60 * 1000);
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return `${china.getFullYear()}-${pad(china.getMonth() + 1)}-${pad(china.getDate())} ${pad(china.getHours())}:${pad(china.getMinutes())}:${pad(china.getSeconds())}`;
}

/** 淘宝开放平台 MD5 签名：params 按 key 升序，key+value 无符号拼接，md5(secret+str+secret) 转大写 */
function signTaobao(params: Record<string, string>, appSecret: string): string {
  const sorted = Object.keys(params).sort();
  const str = sorted.map((k) => `${k}${params[k]}`).join('');
  return createHash('md5').update(appSecret + str + appSecret, 'utf8').digest('hex').toUpperCase();
}

/**
 * 调用淘宝客物料搜索 taobao.tbk.dg.material.optional，返回价格与店铺；失败或未配置则回退模拟数据。
 * 接入说明见 TAOBAO_SETUP_GUIDE.md
 */
async function fetchTaobaoPrices(setNumber: string, setName?: string | null): Promise<{
  prices: number[];
  stores: Array<{ shopName: string; price: number; affiliateLink: string }>;
  source: 'taobao' | 'mock';
  mockReason?: string;
}> {
  const appKey = process.env.TAOBAO_APP_KEY?.trim();
  const appSecret = process.env.TAOBAO_APP_SECRET?.trim();
  let adzoneId = process.env.TAOBAO_ADZONE_ID?.trim() || '';
  // 若填的是完整 PID（如 mm_91078544_3390750117_116222400266），只取最后一段数字作为 adzone_id
  if (adzoneId && adzoneId.includes('_')) {
    const last = adzoneId.split('_').pop() || '';
    if (/^\d+$/.test(last)) adzoneId = last;
  }

  // 淘宝搜索时去掉编号末尾的 -1，否则搜不到（如 10246-1 → 乐高 10246）
  const setForSearch = setNumber.replace(/-1$/, '');
  const keyword = `乐高 ${setForSearch} ${(setName || '').trim()}`.trim() || `乐高 ${setForSearch}`;
  const searchUrl = `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}`;

  const fallback = (reason: string) => {
    console.warn('[淘宝价格] 回退模拟数据:', reason);
    const m = getMockStores(setNumber, keyword, searchUrl);
    return { ...m, source: 'mock' as const, mockReason: reason };
  };

  // 未配置三项环境变量 → 直接回退
  if (!appKey || !appSecret || !adzoneId) {
    return fallback('TAOBAO_APP_KEY、TAOBAO_APP_SECRET、TAOBAO_ADZONE_ID 未配置或为空。请在服务器 .env 中配置并重启 app（docker compose up -d）。详见 TAOBAO_SETUP_GUIDE.md');
  }

  try {
    const params: Record<string, string> = {
      method: 'taobao.tbk.dg.material.optional',
      app_key: appKey,
      timestamp: getChinaTimestamp(),
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      adzone_id: adzoneId,
      q: keyword,
      page_size: '20',
      page_no: '1',
    };
    params.sign = signTaobao(params, appSecret);

    const res = await fetch('https://eco.taobao.com/router/rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams(params).toString(),
    });
    const json = (await res.json()) as Record<string, unknown>;

    const err = json.error_response as { code?: number; sub_code?: string; sub_msg?: string; msg?: string } | undefined;
    if (err?.code) {
      // 错误 11 + scope ids：多为「当前 App Key 对应的应用」未获准物料搜索权限，或应用未上线
      const detail = [err.msg, err.sub_code, err.sub_msg].filter(Boolean).join(' ');
      // 用 console.error 并拼成单行，便于在 docker logs 中 grep 或直接看到完整 JSON
      console.error('[淘宝价格] error_response: ' + JSON.stringify(json.error_response));
      return fallback(`淘宝接口返回错误: ${err.code} ${detail || ''}`);
    }

    const resp = json.tbk_dg_material_optional_response as Record<string, unknown> | undefined;
    const list = resp?.result_list as { map_data?: Array<Record<string, unknown>> } | undefined;
    const items = list?.map_data;

    if (Array.isArray(items) && items.length > 0) {
      const prices: number[] = [];
      const stores: Array<{ shopName: string; price: number; affiliateLink: string }> = [];
      for (const it of items) {
        const p = parseFloat(String(it.zk_final_price || it.zk_final_price_wap || it.reserve_price || 0));
        if (p > 0) prices.push(p);
        const link = String(it.coupon_click_url || it.click_url || '');
        const shop = String(it.shop_title || it.title || '未知店铺').slice(0, 60);
        if (link) {
          stores.push({
            shopName: shop,
            price: p > 0 ? p : parseFloat(String(it.reserve_price || 0)) || 0,
            affiliateLink: link,
          });
        }
      }
      if (prices.length > 0 || stores.length > 0) {
        return {
          prices: prices.length > 0 ? prices : [300],
          stores: stores.length > 0 ? stores : getMockStores(setNumber, keyword, searchUrl).stores,
          source: 'taobao',
        };
      }
    }

    return fallback('淘宝接口返回空结果');
  } catch (e) {
    return fallback(`请求异常: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function getMockStores(
  setNumber: string,
  keyword: string,
  searchUrl: string
): { prices: number[]; stores: Array<{ shopName: string; price: number; affiliateLink: string }> } {
  return {
    prices: [299, 305, 310, 295, 320, 298, 315, 302, 308, 300, 312, 304, 307, 301, 309],
    stores: Array.from({ length: 15 }, (_, i) => ({
      shopName: `示例店铺 ${i + 1}（接入淘宝联盟 API 后显示真实店铺）`,
      price: 300 + Math.random() * 20,
      affiliateLink: searchUrl,
    })),
  };
}

/**
 * 计算中位数价格（去除最高5个和最低5个）
 */
function calculateMedian(prices: number[]): number {
  if (prices.length === 0) return 0;
  
  const sorted = [...prices].sort((a, b) => a - b);
  
  // 去除最高5个和最低5个
  const trimmed = sorted.slice(5, sorted.length - 5);
  
  if (trimmed.length === 0) {
    // 如果去除后没有数据，使用原始数据的中位数
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  const mid = Math.floor(trimmed.length / 2);
  return trimmed.length % 2 === 0
    ? (trimmed[mid - 1] + trimmed[mid]) / 2
    : trimmed[mid];
}

export async function POST(request: NextRequest) {
  try {
    // 价格刷新接口：暂不校验 API 密钥，任意用户可点「更新价格」
    // 若需保护，可后续在反向代理或中间件中加鉴权

    const setNumber = request.nextUrl.searchParams.get('setNumber');
    
    if (!setNumber) {
      return NextResponse.json(
        { error: '缺少 setNumber 参数' },
        { status: 400 }
      );
    }

    // 获取乐高套装信息
    const legoSet = await prisma.legoSet.findUnique({
      where: { setNumber },
    });

    if (!legoSet) {
      return NextResponse.json(
        { error: '未找到该乐高套装' },
        { status: 404 }
      );
    }

    // 从淘宝获取价格（传入套装名称便于搜索）
    const { prices, stores, source, mockReason } = await fetchTaobaoPrices(setNumber, legoSet.name);
    
    if (prices.length === 0) {
      return NextResponse.json(
        { error: '未找到价格信息' },
        { status: 404 }
      );
    }

    // 计算中位数价格
    const medianPrice = calculateMedian(prices);

    // 更新数据库
    const currentDate = new Date().toISOString().split('T')[0];
    const priceHistory = parsePriceHistory(legoSet.priceHistory);

    // 添加新的价格点
    priceHistory.push({
      date: currentDate,
      price: medianPrice,
    });

    await prisma.legoSet.update({
      where: { setNumber },
      data: {
        lastPrice: medianPrice,
        priceHistory: priceHistory as any,
      },
    });

    // 返回 Top 15 店铺
    const topStores = stores
      .sort((a, b) => a.price - b.price)
      .slice(0, 15);

    return NextResponse.json({
      success: true,
      medianPrice,
      stores: topStores,
      message: '价格更新成功',
      source,
      mockReason: source === 'mock' ? mockReason : undefined,
    });
  } catch (error: any) {
    console.error('价格更新错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
