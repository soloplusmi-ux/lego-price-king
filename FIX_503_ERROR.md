# 修复 HTTP 503 错误

## 🔍 问题诊断

HTTP 503 表示服务不可用，通常是因为应用无法启动。

---

## ✅ 在服务器上执行诊断

```bash
cd /opt/lego-price-king

# 1. 查看应用日志（看具体错误）
docker compose logs --tail=50 app

# 2. 检查容器状态
docker compose ps

# 3. 测试本地连接
curl -v http://localhost:3000 2>&1 | head -20
```

---

## 🔧 常见原因和解决方案

### 问题 1: Prisma 运行时文件缺失

**症状：** 日志显示 `Cannot find module '/app/node_modules/@prisma/client/runtime/...'`

**解决：** 在容器启动时重新生成 Prisma Client

---

### 问题 2: 应用启动失败

**症状：** 日志中有其他错误信息

**解决：** 根据具体错误信息修复

---

## 🚀 完整修复步骤

### 步骤 1: 检查日志

```bash
docker compose logs app
```

### 步骤 2: 如果还是 Prisma 问题，修改启动命令

编辑 `docker-compose.yml`：

```bash
nano docker-compose.yml
```

找到 `command:` 这一行，改为：

```yaml
command: sh -c "cd /app && npx prisma generate && node server.js"
```

保存后重启：

```bash
docker compose down
docker compose up -d
docker compose logs -f app
```

---

告诉我日志中的具体错误信息！
