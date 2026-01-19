#!/bin/bash

# 服务器端手动修复脚本
# 在服务器上执行: bash MANUAL_FIX_SERVER.sh

set -e

echo "=========================================="
echo "  手动修复所有问题"
echo "=========================================="
echo ""

cd /opt/lego-price-king

# 1. 修复 layout.tsx（移除 Google Fonts）
echo "📝 修复 app/layout.tsx..."
cat > app/layout.tsx <<'EOF'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "乐高比价王 - Lego Price King",
  description: "乐高套装价格比较和追踪平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}
EOF
echo "✅ layout.tsx 已修复"

# 2. 创建工具函数文件
echo "📝 创建 lib/priceHistory.ts..."
mkdir -p lib
cat > lib/priceHistory.ts <<'EOF'
import { Prisma } from '@prisma/client';

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export function parsePriceHistory(jsonValue: Prisma.JsonValue | null): PriceHistoryPoint[] {
  if (!jsonValue) {
    return [];
  }
  
  if (typeof jsonValue !== 'object' || !Array.isArray(jsonValue)) {
    return [];
  }
  
  const result: PriceHistoryPoint[] = [];
  for (const item of jsonValue) {
    if (
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      'date' in item &&
      'price' in item
    ) {
      const dateValue = (item as any).date;
      const priceValue = (item as any).price;
      
      if (typeof dateValue === 'string' && typeof priceValue === 'number') {
        result.push({
          date: dateValue,
          price: priceValue,
        });
      }
    }
  }
  
  return result;
}
EOF
echo "✅ priceHistory.ts 已创建"

# 3. 修复 API 路由
echo "📝 修复 app/api/refresh-prices/route.ts..."
# 读取文件并替换导入和转换逻辑
sed -i '1s/^import { NextRequest, NextResponse }/import { NextRequest, NextResponse }/' app/api/refresh-prices/route.ts
sed -i '/^import { NextRequest/i import { parsePriceHistory } from "@/lib/priceHistory";' app/api/refresh-prices/route.ts
sed -i '/^const prisma = new PrismaClient();/i import { PriceHistoryPoint } from "@/lib/priceHistory";' app/api/refresh-prices/route.ts
sed -i '/interface PriceHistoryPoint {/,/}/d' app/api/refresh-prices/route.ts
sed -i 's/const priceHistory: PriceHistoryPoint\[\] =.*/const priceHistory = parsePriceHistory(legoSet.priceHistory);/' app/api/refresh-prices/route.ts
echo "✅ API 路由已修复"

# 4. 修复页面
echo "📝 修复 app/set/[setNumber]/page.tsx..."
sed -i '/^import { PrismaClient }/a import { parsePriceHistory } from "@/lib/priceHistory";' app/set/\[setNumber\]/page.tsx
sed -i '/interface PriceHistoryPoint {/,/}/d' app/set/\[setNumber\]/page.tsx
sed -i 's/const priceHistory: PriceHistoryPoint\[\] =.*/const priceHistory = parsePriceHistory(set.priceHistory);/' app/set/\[setNumber\]/page.tsx
echo "✅ 页面已修复"

# 5. 验证修复
echo "🔍 验证修复..."
if grep -q "google" app/layout.tsx; then
  echo "❌ layout.tsx 仍有 Google Fonts"
else
  echo "✅ layout.tsx 已移除 Google Fonts"
fi

if [ -f lib/priceHistory.ts ]; then
  echo "✅ priceHistory.ts 已创建"
else
  echo "❌ priceHistory.ts 创建失败"
fi

# 6. 重新构建
echo ""
echo "🔨 开始重新构建..."
docker compose down
rm -rf .next
docker system prune -f
docker compose build --no-cache
docker compose up -d

echo ""
echo "=========================================="
echo "✅ 修复完成！"
echo "=========================================="
echo ""
echo "查看服务状态: docker compose ps"
echo "查看日志: docker compose logs -f app"
