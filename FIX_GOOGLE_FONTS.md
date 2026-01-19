# 修复 Google Fonts 网络超时问题

## ❌ 问题：无法从 Google Fonts 获取字体

### 错误信息
```
Failed to fetch 'Inter' from Google Fonts.
errno: 'ETIMEDOUT',
code: 'ETIMEDOUT'
```

### 原因
服务器无法访问 Google Fonts（网络限制或防火墙问题），导致构建失败。

### ✅ 解决方案

我已经修复了代码，现在使用系统默认字体，不再依赖 Google Fonts。

**修改内容**：
1. 移除了 `next/font/google` 的导入
2. 使用 Tailwind CSS 的系统字体栈
3. 不再需要网络请求获取字体

---

## 🔄 更新代码到服务器

### 方法 1: 使用 Git（推荐）

```bash
# 在服务器上
cd /opt/lego-price-king

# 拉取最新代码
git pull
```

### 方法 2: 手动更新（如果 Git 不可用）

```bash
# 在服务器上编辑 layout.tsx
cd /opt/lego-price-king
nano app/layout.tsx
```

将内容替换为：

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

---

## 🔨 重新构建 Docker

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 停止服务
docker compose down

# 清理构建缓存
docker system prune -f

# 重新构建（不使用缓存）
docker compose build --no-cache

# 启动服务
docker compose up -d
```

---

## 🔍 验证修复

### 检查构建日志

```bash
# 查看构建过程
docker compose build

# 应该能看到成功构建，没有 Google Fonts 错误
```

### 检查服务状态

```bash
# 查看服务状态
docker compose ps

# 应该看到两个容器都在运行
```

### 检查网站

访问：`http://8.138.110.247:3000`

网站应该能正常显示（字体可能略有不同，但功能正常）。

---

## 📝 关于字体

修复后，网站将使用系统默认字体：
- Windows: Segoe UI
- macOS: San Francisco
- Linux: 系统默认字体

这些字体都是本地字体，不需要网络请求，加载更快。

---

## ⚠️ 如果构建仍然失败

如果还有其他网络问题，可以：

1. **检查网络连接**：
```bash
# 测试网络
ping google.com
curl -I https://fonts.googleapis.com
```

2. **使用代理**（如果服务器有代理）：
在 Dockerfile 中添加代理配置

3. **查看详细错误**：
```bash
docker compose build 2>&1 | tee build.log
cat build.log
```

告诉我具体的错误信息，我会继续帮您解决！
