# 服务器更新指南

## ✅ 本地代码已成功推送到 GitHub！

现在需要在服务器上拉取最新代码并重新构建。

---

## 🚀 在服务器上执行以下命令

### 步骤 1: SSH 连接到服务器

```bash
ssh root@您的服务器IP
```

### 步骤 2: 进入项目目录

```bash
cd /opt/lego-price-king
```

### 步骤 3: 拉取最新代码

```bash
# 放弃所有本地更改（如果有）
git reset --hard HEAD

# 拉取最新代码
git pull origin main
```

### 步骤 4: 验证文件已更新

```bash
# 检查工具函数文件是否存在
ls -la lib/priceHistory.ts

# 检查文件内容
head -20 lib/priceHistory.ts
```

### 步骤 5: 重新构建 Docker

```bash
# 停止服务
docker compose down

# 删除构建缓存
rm -rf .next

# 清理 Docker 缓存（可选）
docker system prune -f

# 重新构建
docker compose build --no-cache

# 启动服务
docker compose up -d
```

### 步骤 6: 查看日志确认构建成功

```bash
# 查看应用日志
docker compose logs -f app

# 如果看到 "Ready" 或没有错误，说明构建成功
# 按 Ctrl+C 退出日志查看
```

### 步骤 7: 验证网站

访问：`http://您的服务器IP:3000`

---

## 📋 完整一键命令（复制执行）

```bash
cd /opt/lego-price-king && \
git reset --hard HEAD && \
git pull origin main && \
docker compose down && \
rm -rf .next && \
docker compose build --no-cache && \
docker compose up -d && \
echo "✅ 更新完成！查看日志: docker compose logs -f app"
```

---

## ⚠️ 如果 git pull 失败

如果服务器也无法连接 GitHub，可以手动创建文件：

```bash
cd /opt/lego-price-king

# 1. 创建工具函数
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

# 2. 修复 layout.tsx
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

# 3. 然后手动编辑 API 和页面文件（使用 nano）
# 4. 重新构建
docker compose down
rm -rf .next
docker compose build --no-cache
docker compose up -d
```

---

告诉我服务器上的执行结果！
