# 服务器端更新指南（阿里云环境）

## ⚠️ 重要：阿里云服务器无法访问 Google 服务

由于服务器在阿里云，所有 Google 相关的服务都无法访问，包括：
- Google Fonts
- Google APIs
- 其他 Google 服务

我已经修复了代码，移除了所有 Google 依赖。现在需要在服务器上更新代码。

---

## 🔄 方法 1: 使用 Git 更新（推荐）

### 步骤 1: 配置 Git（如果还没配置）

```bash
# 在服务器上
cd /opt/lego-price-king

# 检查是否已有远程仓库
git remote -v

# 如果没有，添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/lego-price-king.git

# 拉取最新代码
git pull origin main
```

### 步骤 2: 重新构建

```bash
# 停止服务
docker compose down

# 清理缓存
docker system prune -f

# 重新构建
docker compose build --no-cache

# 启动服务
docker compose up -d
```

---

## 🔄 方法 2: 手动更新文件（如果 Git 不可用）

### 步骤 1: 更新 layout.tsx

```bash
# 在服务器上
cd /opt/lego-price-king

# 编辑文件
nano app/layout.tsx
```

**删除所有内容，粘贴以下内容**：

```tsx
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
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 2: 更新 tailwind.config.ts

```bash
nano tailwind.config.ts
```

找到 `theme:` 部分，在 `container:` 之后添加 `fontFamily:`：

```ts
theme: {
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },
  fontFamily: {
    sans: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ],
  },
  extend: {
    // ... 其他配置保持不变
  },
},
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 3: 更新 Dockerfile（如果还没更新）

```bash
nano Dockerfile
```

找到第 10-11 行，确保是：

```dockerfile
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 4: 重新构建

```bash
# 停止服务
docker compose down

# 清理所有缓存和旧镜像
docker system prune -af

# 重新构建（不使用缓存）
docker compose build --no-cache

# 启动服务
docker compose up -d
```

---

## 🔍 验证更新

### 检查文件是否正确

```bash
# 检查 layout.tsx 是否包含 Google Fonts
grep -i "google" app/layout.tsx
# 应该没有输出（如果还有，说明没更新成功）

# 检查 tailwind.config.ts
grep -i "fontFamily" tailwind.config.ts
# 应该能看到 fontFamily 配置
```

### 检查构建过程

```bash
# 查看构建日志
docker compose build 2>&1 | tee build.log

# 检查是否有 Google Fonts 错误
grep -i "google\|font" build.log
# 应该没有错误信息
```

### 检查服务状态

```bash
# 查看服务
docker compose ps

# 查看日志
docker compose logs app --tail 50
```

---

## 🚨 如果构建仍然失败

### 检查网络连接

```bash
# 测试是否能访问 Google（应该失败）
curl -I https://fonts.googleapis.com --max-time 5

# 测试是否能访问 npm registry（应该成功）
curl -I https://registry.npmjs.org --max-time 5
```

### 完全清理并重建

```bash
# 停止所有服务
docker compose down -v

# 删除所有相关镜像
docker images | grep lego-price-king | awk '{print $3}' | xargs docker rmi -f

# 清理所有未使用的资源
docker system prune -af --volumes

# 重新构建
docker compose build --no-cache

# 启动服务
docker compose up -d
```

### 查看详细错误

```bash
# 保存完整构建日志
docker compose build --no-cache 2>&1 | tee /tmp/build.log

# 查看错误
cat /tmp/build.log | grep -i error
cat /tmp/build.log | grep -i "failed\|timeout"
```

---

## ✅ 成功标志

构建成功后，您应该看到：

1. **构建日志**：
   - ✅ `Successfully built`
   - ✅ 没有 `Google Fonts` 错误
   - ✅ 没有 `ETIMEDOUT` 错误

2. **服务状态**：
   ```bash
   docker compose ps
   ```
   - ✅ `lego_price_king_app` 状态为 `Up`
   - ✅ `lego_price_king_db` 状态为 `Up`

3. **网站访问**：
   - ✅ `http://8.138.110.247:3000` 可以正常访问

---

## 📝 重要提示

1. **所有 Google 服务都已移除**，代码现在完全离线构建
2. **使用系统字体**，不需要网络请求
3. **构建速度更快**，因为没有外部依赖

如果还有问题，请提供完整的构建日志。
