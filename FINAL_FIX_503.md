# 最终修复 HTTP 503 错误

## 🔍 当前问题

容器状态是 `Created` 而不是 `Up`，说明应用启动失败。

---

## ✅ 立即执行诊断

```bash
cd /opt/lego-price-king

# 查看应用日志（看具体错误）
docker compose logs app

# 查看容器状态
docker compose ps -a
```

---

## 🔧 可能的解决方案

### 方案 1: 修改 Dockerfile，在构建时安装 Prisma

问题可能是 standalone 模式下 Prisma 文件没有正确包含。修改 Dockerfile：

```bash
nano Dockerfile
```

在 `runner` 阶段，在 `USER nextjs` 之前添加：

```dockerfile
# 安装 Prisma（确保运行时可用）
RUN npm install -g prisma @prisma/client
```

### 方案 2: 修改启动命令，使用 root 用户安装

```bash
nano docker-compose.yml
```

修改 `command:` 为：

```yaml
command: sh -c "npm install prisma @prisma/client && npx prisma generate && node server.js"
```

并且需要修改 Dockerfile，在启动时使用 root 用户：

```dockerfile
# 在 USER nextjs 之前
RUN chown -R nextjs:nodejs /app
USER nextjs
```

### 方案 3: 在 Dockerfile 中复制完整的 node_modules

修改 Dockerfile，在 runner 阶段复制完整的 Prisma node_modules：

```dockerfile
# 复制完整的 Prisma node_modules（包括所有子目录）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
# 递归复制 @prisma/client 的所有内容
RUN mkdir -p node_modules/@prisma/client && \
    cp -r /app/node_modules/@prisma/client/* node_modules/@prisma/client/ 2>/dev/null || true
```

---

## 🚀 推荐方案：修改 Dockerfile

在服务器上执行：

```bash
cd /opt/lego-price-king

# 编辑 Dockerfile
nano Dockerfile
```

找到第 54 行左右（`RUN mkdir -p node_modules/@prisma/client/runtime || true`），在这行**之前**添加：

```dockerfile
# 安装 Prisma CLI 和 Client（确保运行时可用）
RUN npm install -g prisma @prisma/client
```

保存后重新构建。

---

告诉我日志中的具体错误，我会提供更精确的修复方案！
