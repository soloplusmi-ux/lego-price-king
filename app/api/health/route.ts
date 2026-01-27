import { NextResponse } from 'next/server';

/**
 * 健康检查：不依赖数据库，用于确认 Next.js 与容器是否正常。
 * 若 /api/health 返回 200 但页面仍报 Application error，则问题在具体页面（多为 Prisma/DB）。
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'lego-price-king',
    at: new Date().toISOString(),
  });
}
