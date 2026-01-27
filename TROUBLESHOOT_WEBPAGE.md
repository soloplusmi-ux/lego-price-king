# 排查网页打不开的问题

## 🔍 诊断步骤

### 步骤 1: 检查容器状态

```bash
cd /opt/lego-price-king

# 查看所有容器状态
docker compose ps

# 或者使用
docker ps -a | grep lego-price-king
```

**应该看到两个容器都在运行：**
- `lego_price_king_db` - 状态应该是 `Up` 或 `Healthy`
- `lego_price_king_app` - 状态应该是 `Up`

---

### 步骤 2: 查看应用日志

```bash
# 查看应用容器的日志（看是否有错误）
docker compose logs app

# 或者实时查看日志
docker compose logs -f app
```

**查找错误信息：**
- 如果有 `Error` 或 `Failed`，说明应用启动失败
- 如果看到 `Ready` 或 `started server on 0.0.0.0:3000`，说明应用已启动

---

### 步骤 3: 检查端口映射

```bash
# 查看端口映射
docker compose ps

# 或者
docker port lego_price_king_app
```

**应该看到：**
```
3000/tcp -> 0.0.0.0:3000
```

---

### 步骤 4: 检查防火墙

```bash
# 检查防火墙是否开放了 3000 端口
ufw status

# 或者
iptables -L -n | grep 3000
```

**如果防火墙阻止了，需要开放端口：**
```bash
# 使用 ufw
ufw allow 3000/tcp

# 或者使用 iptables
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

---

### 步骤 5: 测试本地连接

```bash
# 在服务器上测试应用是否响应
curl http://localhost:3000

# 或者
curl http://127.0.0.1:3000
```

**如果返回 HTML 内容，说明应用正常运行。**

---

### 步骤 6: 检查环境变量

```bash
# 检查 .env 文件是否存在
ls -la .env

# 检查关键环境变量
grep DATABASE_URL .env
grep PORT .env
```

---

## 🚀 快速诊断命令（一键执行）

```bash
cd /opt/lego-price-king && \
echo "=== 1. 容器状态 ===" && \
docker compose ps && \
echo "" && \
echo "=== 2. 应用日志（最后 20 行）===" && \
docker compose logs --tail=20 app && \
echo "" && \
echo "=== 3. 端口映射 ===" && \
docker port lego_price_king_app 2>&1 && \
echo "" && \
echo "=== 4. 本地测试 ===" && \
curl -I http://localhost:3000 2>&1 | head -5
```

---

## 🔧 常见问题和解决方案

### 问题 1: 容器已创建但未运行

**症状：** `docker compose ps` 显示容器状态为 `Created` 而不是 `Up`

**解决：**
```bash
# 重启容器
docker compose restart app

# 或者重新启动
docker compose down
docker compose up -d
```

---

### 问题 2: 应用启动失败

**症状：** 日志中有 `Error` 或 `Failed to start`

**解决：**
```bash
# 查看详细日志
docker compose logs app

# 检查常见错误：
# - DATABASE_URL 未配置
# - Prisma 连接失败
# - 端口被占用
```

---

### 问题 3: 端口未映射

**症状：** `docker port` 没有输出

**解决：**
检查 `docker-compose.yml` 中的端口配置：
```yaml
ports:
  - "3000:3000"
```

---

### 问题 4: 防火墙阻止

**症状：** 服务器本地可以访问，但外部无法访问

**解决：**
```bash
# 开放端口
ufw allow 3000/tcp
ufw reload

# 或者在阿里云控制台配置安全组规则
```

---

## 📋 完整检查清单

- [ ] 容器状态是 `Up`
- [ ] 应用日志没有错误
- [ ] 端口 3000 已映射
- [ ] 防火墙已开放 3000 端口
- [ ] 服务器本地可以访问
- [ ] 阿里云安全组已配置

---

告诉我执行诊断命令的结果，我会提供针对性的解决方案！
