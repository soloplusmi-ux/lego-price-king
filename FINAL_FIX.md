# 最终修复方案（阿里云服务器）

## ⚠️ 问题确认

从错误信息看，服务器上的代码仍然包含 Google Fonts，说明更新没有成功。

## ✅ 解决方案：手动更新文件（最可靠）

由于 Git 操作可能有问题，我们直接手动更新文件。

### 在服务器上执行以下命令：

```bash
# 进入项目目录
cd /opt/lego-price-king

# 1. 更新 layout.tsx（删除 Google Fonts）
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

# 2. 验证 layout.tsx 已更新
grep -i "google" app/layout.tsx
# 应该没有输出

# 3. 检查 tailwind.config.ts 是否有 fontFamily
grep -i "fontFamily" tailwind.config.ts

# 如果没有输出，需要添加字体配置
# 4. 更新 tailwind.config.ts（如果还没有 fontFamily）
```

如果 `grep -i "fontFamily" tailwind.config.ts` 没有输出，执行：

```bash
# 备份原文件
cp tailwind.config.ts tailwind.config.ts.bak

# 使用 sed 添加 fontFamily（在 container 配置后）
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
      ],\
' tailwind.config.ts
```

或者手动编辑：

```bash
nano tailwind.config.ts
```

在 `container: { ... },` 之后添加 `fontFamily:` 配置。

---

## 🔨 重新构建

```bash
# 停止服务
docker compose down

# 清理所有缓存和构建文件
docker system prune -af
rm -rf .next node_modules

# 重新构建（不使用缓存）
docker compose build --no-cache

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f app
```

---

## 🔍 验证

```bash
# 1. 确认 layout.tsx 没有 Google
grep -i "google" app/layout.tsx
# 应该没有输出

# 2. 确认 tailwind.config.ts 有 fontFamily
grep -i "fontFamily" tailwind.config.ts
# 应该能看到配置

# 3. 检查服务状态
docker compose ps
# 应该看到两个容器都在运行

# 4. 查看构建日志（如果没有错误）
docker compose logs app | tail -20
```

---

## 📝 如果构建仍然失败

查看详细错误：

```bash
# 保存完整构建日志
docker compose build --no-cache 2>&1 | tee /tmp/build.log

# 查看错误
cat /tmp/build.log | grep -i "error\|failed\|timeout" | tail -20
```

把错误信息发给我，我会继续帮您解决。
