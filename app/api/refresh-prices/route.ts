import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PriceHistoryPoint {
  date: string;
  price: number;
}

/**
 * 从淘宝联盟 API 获取价格
 * 注意: 这里需要根据实际的淘宝联盟 API 文档实现
 */
async function fetchTaobaoPrices(setNumber: string): Promise<{
  prices: number[];
  stores: Array<{ shopName: string; price: number; affiliateLink: string }>;
}> {
  // TODO: 实现淘宝联盟 API 调用
  // 这里是一个示例实现，需要根据实际 API 文档修改
  
  const appKey = process.env.TAOBAO_APP_KEY;
  const appSecret = process.env.TAOBAO_APP_SECRET;
  const adzoneId = process.env.TAOBAO_ADZONE_ID;

  if (!appKey || !appSecret || !adzoneId) {
    throw new Error('淘宝联盟 API 配置不完整');
  }

  // 示例: 调用淘宝联盟 API
  // const response = await fetch('https://eco.taobao.com/router/rest', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     method: 'taobao.tbk.item.get',
  //     app_key: appKey,
  //     // ... 其他参数
  //   }),
  // });

  // 临时返回模拟数据
  return {
    prices: [299, 305, 310, 295, 320, 298, 315, 302, 308, 300, 312, 304, 307, 301, 309],
    stores: Array.from({ length: 15 }, (_, i) => ({
      shopName: `店铺 ${i + 1}`,
      price: 300 + Math.random() * 20,
      affiliateLink: `https://example.com/product/${setNumber}?shop=${i + 1}`,
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
    // 验证 API 密钥（可选，如果配置了则验证）
    const authHeader = request.headers.get('authorization');
    const apiKey = request.nextUrl.searchParams.get('key') || 
                   authHeader?.replace('Bearer ', '') ||
                   request.headers.get('x-api-key');

    // 如果配置了 API_SECRET_KEY，则必须提供正确的密钥
    if (process.env.API_SECRET_KEY) {
      if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
        return NextResponse.json(
          { error: '未授权访问，请提供有效的 API 密钥' },
          { status: 401 }
        );
      }
    }

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

    // 从淘宝获取价格
    const { prices, stores } = await fetchTaobaoPrices(setNumber);
    
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
    
    // 安全地转换 priceHistory
    let priceHistory: PriceHistoryPoint[] = [];
    if (legoSet.priceHistory && typeof legoSet.priceHistory === 'object' && Array.isArray(legoSet.priceHistory)) {
      // 验证并转换每个元素
      priceHistory = legoSet.priceHistory
        .filter((item: any): item is PriceHistoryPoint => 
          item && 
          typeof item === 'object' && 
          typeof item.date === 'string' && 
          typeof item.price === 'number'
        )
        .map((item: any) => ({
          date: String(item.date),
          price: Number(item.price),
        }));
    }

    // 添加新的价格点
    priceHistory.push({
      date: currentDate,
      price: medianPrice,
    });

    await prisma.legoSet.update({
      where: { setNumber },
      data: {
        lastPrice: medianPrice,
        priceHistory: priceHistory,
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
    });
  } catch (error: any) {
    console.error('价格更新错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
