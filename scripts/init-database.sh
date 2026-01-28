#!/bin/sh

# 数据库初始化脚本
# 确保数据库和表结构存在

set -e

echo "开始初始化数据库..."

# 等待 PostgreSQL 就绪
until pg_isready -h postgres -U postgres; do
  echo "等待 PostgreSQL 启动..."
  sleep 1
done

echo "PostgreSQL 已就绪"

# 检查数据库是否存在，如果不存在则创建
psql -h postgres -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'lego_price_king'" | grep -q 1 || \
psql -h postgres -U postgres -c "CREATE DATABASE lego_price_king;"

echo "✅ 数据库 lego_price_king 已确认存在"

# 运行 Prisma 迁移或推送
cd /app
npx prisma db push --accept-data-loss --skip-generate

echo "✅ 数据库表结构已同步"
