-- 乐高比价王：创建 lego_sets 表（与 prisma/schema.prisma 一致）
-- 用法：先确保数据库 lego_price_king 已存在，再在项目根目录执行：
--   docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -f - < prisma/init-lego_sets.sql

CREATE TABLE IF NOT EXISTS "lego_sets" (
  "setNumber"    TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "imageUrl"     TEXT NOT NULL,
  "theme"        TEXT NOT NULL,
  "subTheme"     TEXT,
  "year"         INTEGER NOT NULL,
  "minifigs"     INTEGER,
  "lastPrice"    DOUBLE PRECISION,
  "priceHistory" JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lego_sets_pkey" PRIMARY KEY ("setNumber")
);
