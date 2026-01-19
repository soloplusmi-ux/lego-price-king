# 解决 Git Pull 失败问题

## ❌ 错误信息

```
error: Your local changes to the following files would be overwritten by merge:
    Dockerfile
Please commit your changes or stash them before you merge.
```

## 🔍 问题原因

服务器上的 `Dockerfile` 有本地未提交的更改，Git 无法自动合并。

## ✅ 解决方案

### 方法 1: 放弃本地更改（推荐）

如果服务器上的 `Dockerfile` 更改不重要，直接放弃并使用远程版本：

```bash
# 在服务器上执行
cd /opt/lego-price-king

# 放弃 Dockerfile 的本地更改
git checkout -- Dockerfile

# 现在可以拉取代码了
git pull origin main
```

### 方法 2: 暂存本地更改

如果想保留本地更改（通常不需要）：

```bash
# 暂存本地更改
git stash

# 拉取代码
git pull origin main

# 如果需要，可以恢复本地更改
git stash pop
```

### 方法 3: 直接手动更新文件（最简单）

如果 Git 操作复杂，直接手动更新文件：

```bash
cd /opt/lego-price-king

# 1. 更新 layout.tsx
nano app/layout.tsx
```

删除所有内容，粘贴：

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

```bash
# 2. 检查 tailwind.config.ts 是否有 fontFamily
grep -i "fontFamily" tailwind.config.ts

# 如果没有，需要添加（见下面的完整配置）
```

---

## 🚀 推荐操作（在服务器上执行）

```bash
# 进入项目目录
cd /opt/lego-price-king

# 放弃 Dockerfile 的本地更改
git checkout -- Dockerfile

# 拉取最新代码
git pull origin main

# 验证文件已更新
grep -i "google" app/layout.tsx
# 应该没有输出（如果还有，说明没更新成功）

# 重新构建
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 📝 如果 tailwind.config.ts 没有 fontFamily

如果 `grep -i "fontFamily" tailwind.config.ts` 没有输出，需要手动添加：

```bash
nano tailwind.config.ts
```

找到 `theme: {` 部分，在 `container: { ... },` 之后添加：

```ts
fontFamily: {
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ],
},
```

保存后重新构建。
