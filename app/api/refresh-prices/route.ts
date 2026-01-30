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

/**
 * TOP 开放平台 MD5 签名（文档：API调用方法详解）。
 * 1）参数按名称 ASCII 升序；2）拼装为 key+value 无分隔；3）md5(secret+str+secret) UTF-8；4）十六进制大写 32 位。
 */
function signTaobao(params: Record<string, string>, appSecret: string): string {
  const keys = Object.keys(params).filter((k) => k !== 'sign').sort();
  const str = keys.map((k) => `${k}${params[k]}`).join('');
  return createHash('md5').update(appSecret + str + appSecret, 'utf8').digest('hex').toUpperCase();
}

/**
 * 淘宝价格与店铺获取（仅使用淘宝联盟/淘宝客接口，按官方文档实现）。
 * - 服务地址（TOP-SDK 使用说明·四）：正式环境 HTTPS https://eco.taobao.com/router/rest，海外 https://api.taobao.com/router/rest；format=json 减少传输量。
 * - tbk.dg.material.optional（物料搜索）：adzone_id 必选，q/cat 不能都为空，响应 result_list.map_data；链接 coupon_share_url、url；商品 ID 用 item_id。
 * - tbk.item.info.get（商品详情）：num_iids 必选最大 40，响应 tbk_item_info_get_response.results.n_tbk_item；价格 zk_final_price/reserve_price，店铺 nick。
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

  // TOP-SDK 使用说明·四、服务地址：正式环境 HTTPS https://eco.taobao.com/router/rest，海外 https://api.taobao.com/router/rest
  const TOP_GATEWAY = 'https://eco.taobao.com/router/rest';
  const TOP_TIMEOUT_MS = 15000; // 与 SDK 默认读超时接近，网络差时可适当增大
  const doRequest = async (params: Record<string, string>) => {
    params.sign = signTaobao(params, appSecret);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TOP_TIMEOUT_MS);
    try {
      const res = await fetch(TOP_GATEWAY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: new URLSearchParams(params).toString(),
        signal: controller.signal,
      });
      return (await res.json()) as Record<string, unknown>;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    // Step 1: taobao.tbk.dg.material.optional 淘宝客-推广者-物料搜索（文档：adzone_id 必选，q/cat 不能都为空，响应 result_list.map_data）
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
      platform: '2',
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

    // 文档：商品 ID 用 item_id（num_iid 已废弃）；链接用 coupon_share_url(宝贝+券二合一)、url(宝贝推广链接)；店铺 shop_title、nick
    const numIids: string[] = [];
    const materialByNumIid: Record<string, { shop_title?: string; nick?: string; coupon_share_url?: string; url?: string; coupon_click_url?: string; click_url?: string; title?: string }> = {};
    for (const it of searchItems) {
      const numIid = String(it.item_id ?? it.num_iid ?? '').trim();
      if (numIid && !numIids.includes(numIid)) {
        numIids.push(numIid);
        materialByNumIid[numIid] = {
          shop_title: it.shop_title != null ? String(it.shop_title) : undefined,
          nick: it.nick != null ? String(it.nick) : undefined,
          coupon_share_url: it.coupon_share_url != null ? String(it.coupon_share_url) : undefined,
          url: it.url != null ? String(it.url) : undefined,
          coupon_click_url: it.coupon_click_url != null ? String(it.coupon_click_url) : undefined,
          click_url: it.click_url != null ? String(it.click_url) : undefined,
          title: it.title != null ? String(it.title) : undefined,
        };
      }
    }
    if (numIids.length === 0) {
      return fallback('物料搜索未返回商品 ID');
    }

    // Step 2: taobao.tbk.item.info.get 淘宝客商品详情查询(简版)，num_iids 最大 40 个（文档）
    const numIidsParam = numIids.slice(0, 40).join(',');
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
      const link = mat?.coupon_share_url || mat?.url || mat?.coupon_click_url || mat?.click_url || '';
      const shop = (mat?.shop_title || mat?.nick || mat?.title || it.nick || it.title || '未知店铺').toString().slice(0, 60);
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
