# 最简单的修复方案

## 🎯 问题：TypeScript 类型错误

错误信息：
```
Type error: Conversion of type 'JsonArray' to type 'PriceHistoryPoint[]' may be a mistake
```

## ✅ 已修复

我已经创建了一个安全的类型转换函数，并更新了所有相关文件。

---

## 🚀 在服务器上更新代码

### 方法 1: 使用 Git（推荐）

```bash
# 在服务器上
cd /opt/lego-price-king

# 放弃所有本地更改
git reset --hard HEAD

# 拉取最新代码
git pull origin main
```

### 方法 2: 如果 Git 有问题，手动创建文件

```bash
cd /opt/lego-price-king

# 创建工具函数文件
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
```

然后更新 `app/api/refresh-prices/route.ts` 和 `app/set/[setNumber]/page.tsx`。

---

## 🔨 重新构建

```bash
# 停止服务
docker compose down

# 删除构建缓存
rm -rf .next

# 清理 Docker 缓存
docker system prune -f

# 重新构建
docker compose build --no-cache

# 启动服务
docker compose up -d
```

---

## 📋 完整一键修复（在服务器上执行）

```bash
cd /opt/lego-price-king

# 1. 更新 layout.tsx（移除 Google Fonts）
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

# 2. 创建工具函数
mkdir -p lib
cat > lib/priceHistory.ts <<'EOF'
import { Prisma } from '@prisma/client';

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export function parsePriceHistory(jsonValue: Prisma.JsonValue | null): PriceHistoryPoint[] {
  if (!jsonValue) return [];
  if (typeof jsonValue !== 'object' || !Array.isArray(jsonValue)) return [];
  
  const result: PriceHistoryPoint[] = [];
  for (const item of jsonValue) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item) && 'date' in item && 'price' in item) {
      const dateValue = (item as any).date;
      const priceValue = (item as any).price;
      if (typeof dateValue === 'string' && typeof priceValue === 'number') {
        result.push({ date: dateValue, price: priceValue });
      }
    }
  }
  return result;
}
EOF

# 3. 更新 API 路由
sed -i 's/import { PrismaClient }/@import { PrismaClient } from "@prisma\/client";\nimport { parsePriceHistory } from "@\/lib\/priceHistory";/' app/api/refresh-prices/route.ts
sed -i 's/const priceHistory: PriceHistoryPoint\[\] =.*/const priceHistory = parsePriceHistory(legoSet.priceHistory);/' app/api/refresh-prices/route.ts

# 4. 更新页面
sed -i 's/import { PrismaClient }/@import { PrismaClient } from "@prisma\/client";\nimport { parsePriceHistory } from "@\/lib\/priceHistory";/' app/set/\[setNumber\]/page.tsx
sed -i 's/const priceHistory: PriceHistoryPoint\[\] =.*/const priceHistory = parsePriceHistory(set.priceHistory);/' app/set/\[setNumber\]/page.tsx

# 5. 重新构建
docker compose down
rm -rf .next
docker system prune -f
docker compose build --no-cache
docker compose up -d
```

---

## ⚠️ 如果还是失败

如果手动更新太复杂，可以：

1. **使用 Git 强制重置**：
```bash
cd /opt/lego-price-king
git fetch origin
git reset --hard origin/main
docker compose build --no-cache
docker compose up -d
```

2. **或者暂时禁用类型检查**（不推荐，但可以快速解决）：
在 `tsconfig.json` 中添加：
```json
"compilerOptions": {
  "noImplicitAny": false,
  "strict": false
}
```

告诉我您想用哪种方法，我会提供详细步骤。
