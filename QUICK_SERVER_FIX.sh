#!/bin/bash

# 快速修复脚本 - 在服务器上执行
# 使用方法: bash QUICK_SERVER_FIX.sh

set -e

echo "=========================================="
echo "  修复 Google Fonts 问题"
echo "=========================================="
echo ""

cd /opt/lego-price-king

# 1. 更新 layout.tsx
echo "📝 更新 app/layout.tsx..."
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
echo "✅ layout.tsx 已更新"

# 2. 更新 tailwind.config.ts（添加字体配置）
echo "📝 更新 tailwind.config.ts..."
# 这里需要更复杂的操作，先检查是否已有 fontFamily
if ! grep -q "fontFamily:" tailwind.config.ts; then
  # 使用 sed 在 container 配置后添加 fontFamily
  sed -i '/screens: {/,/},/a\
    },\
    fontFamily: {\
      sans: [\
        '\''-apple-system'\'',\
        '\''BlinkMacSystemFont'\'',\
        '\''"Segoe UI"'\'',\
        '\''Roboto'\'',\
        '\''"Helvetica Neue"'\'',\
        '\''Arial'\'',\
        '\''sans-serif'\'',\
        '\''"Apple Color Emoji"'\'',\
        '\''"Segoe UI Emoji"'\'',\
        '\''"Segoe UI Symbol"'\'',\
      ],\
' tailwind.config.ts
  echo "✅ tailwind.config.ts 已更新"
else
  echo "✅ tailwind.config.ts 已包含字体配置"
fi

# 3. 停止服务
echo "🛑 停止服务..."
docker compose down

# 4. 清理缓存
echo "🧹 清理缓存..."
docker system prune -f

# 5. 重新构建
echo "🔨 重新构建 Docker 镜像..."
docker compose build --no-cache

# 6. 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 7. 等待服务启动
echo "⏳ 等待服务启动（30秒）..."
sleep 30

# 8. 检查状态
echo "📊 检查服务状态..."
docker compose ps

echo ""
echo "=========================================="
echo "✅ 修复完成！"
echo "=========================================="
echo ""
echo "访问网站: http://8.138.110.247:3000"
echo "查看日志: docker compose logs -f app"
