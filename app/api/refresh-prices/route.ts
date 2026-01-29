import { NextRequest, NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
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
 * 淘宝价格与店铺获取（仅使用淘宝客接口，禁止商家接口）。
 * - 禁止使用 taobao.item.get（商家接口）：普通开发者申请不到权限，会一直报 Code 11。
 * - 必须使用淘宝客接口 taobao.tbk.item.info.get 获取商品价格。
 * 流程：先用 taobao.tbk.dg.material.optional 物料搜索得到商品 num_iid，再调用 taobao.tbk.item.info.get 取价格与信息。
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

  const doRequest = async (params: Record<string, string>) => {
    params.sign = signTaobao(params, appSecret);
    const res = await fetch('https://eco.taobao.com/router/rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams(params).toString(),
    });
    return (await res.json()) as Record<string, unknown>;
  };

  try {
    // Step 1: 物料搜索（仅用于拿到商品 num_iid，不做取价）
    const searchParams: Record<string, string> = {
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
    const searchJson = await doRequest(searchParams);

    const searchErr = searchJson.error_response as { code?: number; msg?: string; sub_code?: string; sub_msg?: string } | undefined;
    if (searchErr?.code) {
      console.error('[淘宝价格] error_response: ' + JSON.stringify(searchJson.error_response));
      return fallback(`淘宝接口返回错误: ${searchErr.code} ${[searchErr.msg, searchErr.sub_code, searchErr.sub_msg].filter(Boolean).join(' ')}`);
    }

    const searchResp = searchJson.tbk_dg_material_optional_response as Record<string, unknown> | undefined;
    const searchList = searchResp?.result_list as { map_data?: Array<Record<string, unknown>> } | undefined;
    const searchItems = searchList?.map_data;

    if (!Array.isArray(searchItems) || searchItems.length === 0) {
      return fallback('淘宝接口返回空结果');
    }

    // 从物料搜索结果中提取 num_iid（淘宝客商品 ID），供 taobao.tbk.item.info.get 使用
    const numIids: string[] = [];
    const materialByNumIid: Record<string, { shop_title?: string; coupon_click_url?: string; click_url?: string; title?: string }> = {};
    for (const it of searchItems) {
      const numIid = String(it.num_iid ?? it.item_id ?? '').trim();
      if (numIid && !numIids.includes(numIid)) {
        numIids.push(numIid);
        materialByNumIid[numIid] = {
          shop_title: it.shop_title != null ? String(it.shop_title) : undefined,
          coupon_click_url: it.coupon_click_url != null ? String(it.coupon_click_url) : undefined,
          click_url: it.click_url != null ? String(it.click_url) : undefined,
          title: it.title != null ? String(it.title) : undefined,
        };
      }
    }
    if (numIids.length === 0) {
      return fallback('物料搜索未返回商品 ID');
    }

    // Step 2: 使用淘宝客接口 taobao.tbk.item.info.get 获取商品价格（禁止使用 taobao.item.get 商家接口）
    const numIidsParam = numIids.slice(0, 20).join(',');
    const infoParams: Record<string, string> = {
      method: 'taobao.tbk.item.info.get',
      app_key: appKey,
      timestamp: getChinaTimestamp(),
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      num_iids: numIidsParam,
      platform: '2',
    };
    const infoJson = await doRequest(infoParams);

    const infoErr = infoJson.error_response as { code?: number; msg?: string; sub_code?: string; sub_msg?: string } | undefined;
    if (infoErr?.code) {
      console.error('[淘宝价格] tbk.item.info.get error_response: ' + JSON.stringify(infoJson.error_response));
      return fallback(`淘宝客商品信息接口返回错误: ${infoErr.code} ${[infoErr.msg, infoErr.sub_code, infoErr.sub_msg].filter(Boolean).join(' ')}`);
    }

    const infoResp = infoJson.tbk_item_info_get_response as Record<string, unknown> | undefined;
    const results = infoResp?.results;
    const infoItems = Array.isArray(results)
      ? results
      : (results as { n_tbk_item?: Array<Record<string, unknown>> } | undefined)?.n_tbk_item;

    if (!Array.isArray(infoItems) || infoItems.length === 0) {
      return fallback('淘宝客商品信息接口返回空结果');
    }

    const prices: number[] = [];
    const stores: Array<{ shopName: string; price: number; affiliateLink: string }> = [];
    for (const it of infoItems) {
      const numIid = String(it.num_iid ?? it.item_id ?? '');
      const p = parseFloat(String(it.zk_final_price ?? it.reserve_price ?? it.price ?? 0));
      if (p > 0) prices.push(p);
      const mat = materialByNumIid[numIid];
      const link = mat?.coupon_click_url || mat?.click_url || '';
      const shop = (mat?.shop_title || mat?.title || it.title || '未知店铺').toString().slice(0, 60);
      stores.push({
        shopName: shop,
        price: p > 0 ? p : parseFloat(String(it.reserve_price ?? it.price ?? 0)) || 0,
        affiliateLink: link || searchUrl,
      });
    }

    if (prices.length > 0 || stores.length > 0) {
      return {
        prices: prices.length > 0 ? prices : [300],
        stores: stores.length > 0 ? stores : getMockStores(setNumber, keyword, searchUrl).stores,
        source: 'taobao',
      };
    }

    return fallback('淘宝客商品信息接口未解析到价格');
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

    // 获取乐高套装信息（使用重试机制）
    const legoSet = await withRetry(() =>
      prisma.legoSet.findUnique({
        where: { setNumber },
      })
    );

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

    // 更新数据库（使用重试机制）
    await withRetry(() =>
      prisma.legoSet.update({
        where: { setNumber },
        data: {
          lastPrice: medianPrice,
          priceHistory: priceHistory as any,
        },
      })
    );

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
