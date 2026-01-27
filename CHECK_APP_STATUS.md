# 检查应用状态

## ⚠️ 首先确认：服务器上是否有 .env

`docker-compose` 使用了 `env_file: - .env`，**如果 `/opt/lego-price-king/.env` 不存在，容器可能无法正确启动。**

```bash
ls -la /opt/lego-price-king/.env
```

- **若报错或不存在**：从示例复制并按需填写（数据库等已在 compose 里则可留空或只填 OSS 等）：
  ```bash
  cd /opt/lego-price-king
  cp .env.example .env
  # 编辑 .env，至少保证没有语法错误；DATABASE_URL 已在 compose 中则可不改
  ```

---

## ✅ 端口映射说明

`0.0.0.0:3000->3000/tcp` **是正确的！**

- `0.0.0.0` 表示监听所有网络接口
- 这样外部可以通过服务器 IP `8.138.110.247:3000` 访问
- **不需要修改为服务器 IP**

---

## 🔍 检查应用是否正常运行

### 步骤 1: 查看应用日志

```bash
cd /opt/lego-price-king

# 查看应用日志（看是否有错误）
docker compose logs --tail=50 app
```

**查找关键信息：**
- ✅ 如果看到 `Ready` 或 `started server on 0.0.0.0:3000` → 应用已启动
- ❌ 如果看到 `Error` 或 `Cannot find module` → 应用启动失败

---

### 步骤 2: 测试本地连接

```bash
# 在服务器上测试
curl -I http://localhost:3000

# 或者
curl http://localhost:3000
```

**如果返回 HTTP 响应（如 200 或 HTML），说明应用正常运行。**

---

### 步骤 3: 检查防火墙和安全组

如果本地可以访问但外部无法访问：

#### 检查服务器防火墙

```bash
# 检查防火墙状态
ufw status

# 如果防火墙开启，开放端口
ufw allow 3000/tcp
ufw reload
```

#### 检查阿里云安全组

1. 登录阿里云控制台
2. 进入 ECS 实例
3. 安全组 → 配置规则
4. 检查是否有入站规则：
   - 端口范围：`3000/3000`
   - 协议：`TCP`
   - 授权对象：`0.0.0.0/0` 或 `::/0`

如果没有，需要添加。

---

## 🚀 完整诊断命令

在服务器上执行（`cd /opt/lego-price-king` 后一次粘贴）：

```bash
cd /opt/lego-price-king && \
echo "=== 0. .env 是否存在 ===" && \
ls -la .env 2>&1 && \
echo "" && \
echo "=== 1. 容器状态 ===" && \
docker compose ps && \
echo "" && \
echo "=== 2. 应用日志（最后 50 行）===" && \
docker compose logs --tail=50 app && \
echo "" && \
echo "=== 3. 本地 3000 端口 ===" && \
curl -I http://localhost:3000 2>&1 | head -15 && \
echo "" && \
echo "=== 4. 防火墙 ===" && \
ufw status 2>&1
```

- **0**：缺 `.env` 时先 `cp .env.example .env` 并保存，再 `docker compose up -d --build`。
- **2**：若见 `Cannot find module`、`schema`、`prisma`、`EACCES`，多为 Prisma 或启动命令问题。若见 **`libssl.so.1.1: No such file or directory`**，需在 Dockerfile 的 runner 阶段安装 `openssl1.1-compat`（已加）。
- **3**：若 `curl` 超时或拒绝，多半是 app 未起来或崩了，结合 **2** 的日志排查。

---

## 📋 部署前自检（本地）

- **`public` 目录**：项目根目录需存在（可为空）。缺失时 Docker 构建会在这里报错：`COPY --from=builder /app/public ./public`。已用 `public/.gitkeep` 补上。
- **`.env`**：本地可有可无；**服务器 `/opt/lego-price-king` 下必须有 `.env`**（可来自 `.env.example`），否则 `env_file` 会报错或应用拿不到配置。

---

告诉我执行结果，我会根据具体情况提供解决方案！
