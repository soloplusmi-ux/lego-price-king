import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取指定套装的店铺列表
 * 注意: 当前实现返回空数组，实际应该从数据库或缓存中获取
 * 建议: 在刷新价格时将店铺信息也存储到数据库
 */
export async function GET(request: NextRequest) {
  try {
    const setNumber = request.nextUrl.searchParams.get('setNumber');
    
    if (!setNumber) {
      return NextResponse.json(
        { error: '缺少 setNumber 参数' },
        { status: 400 }
      );
    }

    // TODO: 从数据库获取店铺列表
    // 当前返回空数组，实际应该从数据库或缓存中获取
    // 建议在刷新价格时将店铺信息存储到数据库
    
    return NextResponse.json({
      stores: [],
      message: '暂无店铺信息，请先更新价格',
    });
  } catch (error: any) {
    console.error('获取店铺列表错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
