# 修复 npm run build 错误（Exit Code 1）

## 🔍 问题

Dockerfile 语法已修复，但 Next.js 构建失败（exit code 1）。

---

## ✅ 诊断步骤

### 步骤 1: 查看详细构建日志

```bash
cd /opt/lego-price-king

# 查看完整的构建日志（包含错误详情）
docker compose build --no-cache 2>&1 | tee build.log

# 或者查看最后 50 行错误信息
docker compose build --no-cache 2>&1 | tail -50
```

---

### 步骤 2: 检查常见问题

#### 问题 A: TypeScript 类型错误

如果错误信息包含 `Type error` 或 `TS2322`，说明服务器上的代码还没有更新。

**解决：**
```bash
cd /opt/lego-price-king

# 拉取最新代码
git pull origin main

# 确认 lib/priceHistory.ts 存在
ls -la lib/priceHistory.ts

# 如果不存在，手动创建（参考之前的步骤）
```

#### 问题 B: 缺少依赖

如果错误信息包含 `Cannot find module` 或 `Module not found`。

**解决：**
```bash
# 检查 package.json 是否存在
ls -la package.json

# 检查 node_modules
ls -la node_modules/ | head -10
```

#### 问题 C: Prisma 生成失败

如果错误信息包含 `prisma` 或 `@prisma/client`。

**解决：**
```bash
# 检查 .env 文件是否存在
ls -la .env

# 检查 DATABASE_URL 是否配置
grep DATABASE_URL .env
```

---

## 🚀 完整修复流程

### 1. 确保代码是最新的

```bash
cd /opt/lego-price-king

# 拉取最新代码
git pull origin main

# 验证关键文件存在
ls -la lib/priceHistory.ts
ls -la app/layout.tsx
```

### 2. 如果 lib/priceHistory.ts 不存在，手动创建

```bash
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
```

### 3. 检查并修复 API 和页面文件

```bash
# 检查 API 路由是否使用了 parsePriceHistory
grep -n "parsePriceHistory" app/api/refresh-prices/route.ts

# 检查页面是否使用了 parsePriceHistory
grep -n "parsePriceHistory" app/set/\[setNumber\]/page.tsx
```

如果都没有，需要手动添加导入和使用。

### 4. 重新构建

```bash
docker compose build --no-cache 2>&1 | tee build.log
```

---

## 📋 如果还是失败，查看具体错误

```bash
# 查看构建日志的最后部分
tail -100 build.log

# 或者直接查看错误
docker compose build --no-cache 2>&1 | grep -A 10 "error"
```

---

## 💡 快速诊断命令

```bash
cd /opt/lego-price-king && \
echo "=== 检查关键文件 ===" && \
ls -la lib/priceHistory.ts app/layout.tsx 2>&1 && \
echo "" && \
echo "=== 检查代码更新 ===" && \
git log --oneline -3 && \
echo "" && \
echo "=== 检查 TypeScript 导入 ===" && \
grep -r "parsePriceHistory" app/ lib/ 2>&1 | head -5
```

---

告诉我构建日志中的具体错误信息，我会提供针对性的解决方案！
