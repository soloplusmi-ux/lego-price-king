# 最简单的修复方法（在服务器上执行）

## 🎯 问题

服务器上的 Dockerfile 还是旧版本，需要添加 Alpine 镜像源配置。

---

## ✅ 方法 1: 使用脚本（最简单）

在服务器上执行：

```bash
cd /opt/lego-price-king

# 创建并执行修复脚本
cat > /tmp/fix_dockerfile.sh <<'EOF'
#!/bin/bash
cd /opt/lego-price-king
cp Dockerfile Dockerfile.bak
sed -i '/^RUN apk add --no-cache libc6-compat$/i\
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）\
RUN sed -i '"'"'s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g'"'"' /etc/apk/repositories \&\& \\' Dockerfile
sed -i 's/^RUN apk add --no-cache libc6-compat$/    apk add --no-cache libc6-compat/' Dockerfile
echo "✅ 修复完成！"
grep -B 1 -A 2 "apk add" Dockerfile
EOF

chmod +x /tmp/fix_dockerfile.sh
/tmp/fix_dockerfile.sh
```

---

## ✅ 方法 2: 手动编辑（如果脚本失败）

```bash
cd /opt/lego-price-king

# 编辑文件
nano Dockerfile
```

**找到第 6 行：**
```dockerfile
RUN apk add --no-cache libc6-compat
```

**在这行前面添加两行，然后修改这一行：**

最终应该是：
```dockerfile
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

**注意：**
- 第 2 行末尾有 `&& \`（反斜杠表示续行）
- 第 3 行 `apk add` 前面有 4 个空格（缩进）

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

---

## ✅ 方法 3: 一行命令（最快）

```bash
cd /opt/lego-price-king && \
cp Dockerfile Dockerfile.bak && \
sed -i '6i# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）' Dockerfile && \
sed -i '7iRUN sed -i '"'"'s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g'"'"' /etc/apk/repositories \&\& \\' Dockerfile && \
sed -i 's/^RUN apk add --no-cache libc6-compat$/    apk add --no-cache libc6-compat/' Dockerfile && \
echo "✅ 修复完成！" && \
grep -B 1 -A 2 "apk add" Dockerfile
```

---

## 📋 验证修复

修复后执行：

```bash
grep -B 1 -A 2 "apk add" Dockerfile
```

**应该看到：**
```
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

---

## 🔨 修复后重新构建

```bash
docker compose build --no-cache
docker compose up -d
docker compose logs -f app
```

---

**推荐使用方法 2（手动编辑），最可靠！**
