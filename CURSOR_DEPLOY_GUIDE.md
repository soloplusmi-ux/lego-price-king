# Cursor 终端部署指南

## 📌 在 Cursor 中操作

本指南专门针对在 Cursor IDE 的终端中执行部署操作。

---

## 步骤 1: SSH 连接到服务器

### 在 Cursor 终端中执行

1. **打开 Cursor 终端**
   - 按 `Ctrl + `` (反引号) 或
   - 菜单: Terminal → New Terminal

2. **SSH 连接命令**

```powershell
ssh root@8.138.110.247
```

3. **首次连接提示**
   ```
   The authenticity of host '8.138.110.247' can't be established.
   Are you sure you want to continue connecting (yes/no)?
   ```
   - 输入 `yes` 并按 Enter

4. **输入密码**
   - 输入您的服务器 root 密码（输入时不会显示）
   - 按 Enter 确认

5. **连接成功**
   - 提示符变为: `root@your-server:~#`
   - 现在您已登录到服务器

---

## 步骤 2: 一键安装 Docker 和 Docker Compose

### 复制并执行以下命令块

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker（官方脚本）
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose V2
apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

**预期输出**：
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## 步骤 3: 克隆代码从 GitHub

### 替换 YOUR_USERNAME

```bash
# 安装 Git
apt install git -y

# 创建项目目录
mkdir -p /opt
cd /opt

# 克隆仓库（⚠️ 替换 YOUR_USERNAME 为您的 GitHub 用户名）
git clone https://github.com/YOUR_USERNAME/lego-price-king.git

# 进入项目目录
cd lego-price-king

# 查看文件列表
ls -la
```

**示例**（如果您的 GitHub 用户名是 `john`）：
```bash
git clone https://github.com/john/lego-price-king.git
```

---

## 步骤 4: 配置环境变量

### 4.1 创建 .env 文件

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 复制示例文件
cp .env.example .env
```

### 4.2 编辑 .env 文件

```bash
# 使用 nano 编辑器
nano .env
```

### 4.3 填入配置内容

在编辑器中，将以下内容替换为您的实际配置：

```env
# 数据库配置（⚠️ 修改 YOUR_STRONG_PASSWORD）
DATABASE_URL="postgresql://postgres:YOUR_STRONG_PASSWORD@postgres:5432/lego_price_king?schema=public"

# 阿里云 OSS 配置（⚠️ 填入您的 OSS 凭证）
ALIYUN_OSS_REGION="oss-cn-hangzhou"
ALIYUN_OSS_ACCESS_KEY_ID="你的OSS_ACCESS_KEY_ID"
ALIYUN_OSS_ACCESS_KEY_SECRET="你的OSS_ACCESS_KEY_SECRET"
ALIYUN_OSS_BUCKET="你的bucket名称"
ALIYUN_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"

# 淘宝联盟 API 配置（⚠️ 填入您的淘宝 API 凭证）
TAOBAO_APP_KEY="你的淘宝APP_KEY"
TAOBAO_APP_SECRET="你的淘宝APP_SECRET"
TAOBAO_ADZONE_ID="你的ADZONE_ID"

# API 密钥（⚠️ 生成随机字符串，或使用下面的命令生成）
API_SECRET_KEY="your-very-secure-random-string-here"

# Next.js 配置
NEXT_PUBLIC_APP_URL="http://8.138.110.247:3000"
```

### 4.4 生成随机密码和密钥（可选）

在另一个终端窗口中执行：

```bash
# 生成数据库密码（25 位随机字符串）
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25

# 生成 API 密钥（64 位十六进制）
openssl rand -hex 32
```

将生成的字符串填入 `.env` 文件。

### 4.5 保存并退出 nano

1. 按 `Ctrl + O` (保存)
2. 按 `Enter` (确认文件名)
3. 按 `Ctrl + X` (退出)

---

## 步骤 5: 启动项目

### 5.1 启动 Docker Compose

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 启动所有服务（后台运行）
docker compose up -d

# 查看服务状态
docker compose ps
```

**预期输出**：
```
NAME                    STATUS              PORTS
lego_price_king_app     Up 2 minutes        0.0.0.0:3000->3000/tcp
lego_price_king_db      Up 2 minutes        0.0.0.0:5432->5432/tcp
```

### 5.2 等待服务启动

```bash
# 等待 20 秒让服务完全启动
sleep 20

# 查看日志确认服务正常
docker compose logs app | tail -20
```

### 5.3 初始化数据库

```bash
# 生成 Prisma Client
docker compose exec app npx prisma generate

# 推送数据库结构
docker compose exec app npx prisma db push
```

**预期输出**：
```
✔ Generated Prisma Client
✔ Database schema pushed successfully
```

### 5.4 检查服务健康

```bash
# 检查应用是否响应
curl http://localhost:3000

# 检查数据库连接
docker compose exec postgres pg_isready -U postgres
```

---

## 步骤 6: 验证部署

### 6.1 在浏览器中访问

打开浏览器，访问：
```
http://8.138.110.247:3000
```

应该能看到"乐高比价王"首页。

### 6.2 检查服务状态

```bash
# 查看所有容器
docker compose ps

# 查看应用日志
docker compose logs app --tail 50

# 查看数据库日志
docker compose logs postgres --tail 50
```

---

## 🔧 常用维护命令

### 查看日志

```bash
# 实时查看应用日志
docker compose logs -f app

# 查看最近 100 行日志
docker compose logs app --tail 100

# 查看所有服务日志
docker compose logs -f
```

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart app
docker compose restart postgres
```

### 停止服务

```bash
# 停止所有服务（保留数据）
docker compose down

# 停止并删除数据卷（⚠️ 危险！会删除数据库）
docker compose down -v
```

### 更新代码

```bash
cd /opt/lego-price-king
git pull
docker compose up -d --build
```

---

## ⚠️ 故障排查

### 问题 1: 无法 SSH 连接

**检查**：
- 服务器 IP 是否正确: `8.138.110.247`
- 防火墙是否允许 SSH (端口 22)
- 服务器是否运行

**解决**：
```bash
# 在本地测试连接
ping 8.138.110.247
```

### 问题 2: Docker 安装失败

**检查**：
```bash
# 检查系统版本
lsb_release -a

# 检查网络连接
curl -I https://get.docker.com
```

**解决**：
- 确保服务器可以访问互联网
- 检查 DNS 设置

### 问题 3: 代码克隆失败

**检查**：
- GitHub 仓库地址是否正确
- 仓库是否为公开（或已配置 SSH 密钥）

**解决**：
```bash
# 检查 Git 配置
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 问题 4: 网站无法访问

**检查**：
```bash
# 检查容器状态
docker compose ps

# 检查端口监听
netstat -tulpn | grep 3000

# 检查防火墙
ufw status
```

**解决**：
```bash
# 开放端口
ufw allow 3000/tcp
ufw reload

# 重启服务
docker compose restart app
```

### 问题 5: 数据库连接失败

**检查**：
```bash
# 查看数据库日志
docker compose logs postgres

# 检查数据库是否就绪
docker compose exec postgres pg_isready -U postgres

# 检查环境变量
docker compose exec app env | grep DATABASE_URL
```

**解决**：
- 检查 `.env` 文件中的 `DATABASE_URL` 配置
- 确保数据库密码正确
- 等待数据库完全启动（约 30 秒）

---

## 📋 部署检查清单

### 部署前
- [ ] 已通过 SSH 连接到服务器
- [ ] Docker 和 Docker Compose 已安装
- [ ] 代码已从 GitHub 克隆
- [ ] `.env` 文件已配置完成
- [ ] 所有凭证已填入

### 部署后
- [ ] `docker compose ps` 显示所有容器运行中
- [ ] 可以访问 http://8.138.110.247:3000
- [ ] 数据库初始化成功
- [ ] 日志无错误信息

---

## 🎉 部署完成！

如果所有步骤都成功，您现在可以：
1. 访问网站: http://8.138.110.247:3000
2. 使用本地同步脚本上传数据
3. 开始使用乐高比价王！

如有问题，请查看日志或参考故障排查部分。
