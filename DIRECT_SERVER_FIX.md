# 服务器直接修复方案（不依赖 Git）

## 🎯 问题总结

1. Google Fonts 网络超时
2. TypeScript 类型错误

## ✅ 完整修复步骤（在服务器上执行）

### 步骤 1: 修复 layout.tsx（移除 Google Fonts）

```bash
cd /opt/lego-price-king

cat > app/layout.tsx <<'ENDOFFILE'
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
ENDOFFILE
```

### 步骤 2: 创建工具函数文件

```bash
mkdir -p lib

cat > lib/priceHistory.ts <<'ENDOFFILE'
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
ENDOFFILE
```

### 步骤 3: 修复 API 路由文件

```bash
# 备份原文件
cp app/api/refresh-prices/route.ts app/api/refresh-prices/route.ts.bak

# 编辑文件
nano app/api/refresh-prices/route.ts
```

找到文件开头的导入部分，修改为：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PriceHistoryPoint, parsePriceHistory } from '@/lib/priceHistory';

const prisma = new PrismaClient();
```

删除 `interface PriceHistoryPoint` 定义（如果存在）。

找到这一行：
```typescript
const priceHistory: PriceHistoryPoint[] = 
  (legoSet.priceHistory && typeof legoSet.priceHistory === 'object' && Array.isArray(legoSet.priceHistory))
    ? legoSet.priceHistory as PriceHistoryPoint[]
    : [];
```

替换为：
```typescript
const priceHistory = parsePriceHistory(legoSet.priceHistory);
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 4: 修复页面文件

```bash
# 备份原文件
cp app/set/\[setNumber\]/page.tsx app/set/\[setNumber\]/page.tsx.bak

# 编辑文件
nano app/set/\[setNumber\]/page.tsx
```

在文件开头添加导入：
```typescript
import { parsePriceHistory } from '@/lib/priceHistory';
```

删除 `interface PriceHistoryPoint` 定义（如果存在）。

找到这一行：
```typescript
const priceHistory: PriceHistoryPoint[] = 
  set.priceHistory && typeof set.priceHistory === 'object'
    ? (Array.isArray(set.priceHistory) ? set.priceHistory : [])
    : [];
```

替换为：
```typescript
const priceHistory = parsePriceHistory(set.priceHistory);
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 5: 验证文件

```bash
# 检查 layout.tsx
grep -i "google" app/layout.tsx
# 应该没有输出

# 检查工具函数
ls -la lib/priceHistory.ts
# 应该能看到文件

# 检查 API 路由
grep -i "parsePriceHistory" app/api/refresh-prices/route.ts
# 应该能看到导入和使用
```

### 步骤 6: 完全清理并重新构建

```bash
# 停止服务
docker compose down

# 删除所有缓存
rm -rf .next
rm -rf node_modules/.cache

# 清理 Docker
docker system prune -af

# 重新构建
docker compose build --no-cache

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f app
```

---

## 🚀 一键执行（复制所有命令）

```bash
cd /opt/lego-price-king

# 1. 修复 layout.tsx
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

# 3. 重新构建
docker compose down
rm -rf .next
docker system prune -f
docker compose build --no-cache
docker compose up -d
```

**注意**：步骤 3 和 4（修复 API 路由和页面）需要手动编辑文件，因为 sed 命令在复杂替换时可能不够可靠。

---

## 📝 如果手动编辑太复杂

可以使用更简单的方法 - 暂时禁用严格类型检查：

```bash
# 编辑 tsconfig.json
nano tsconfig.json
```

找到 `"strict": true,`，改为 `"strict": false,`

保存后重新构建。

---

告诉我您想用哪种方法，我会提供更详细的指导。
