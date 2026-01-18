# 快速部署指南 - 阿里云服务器

## 🚀 一键部署（推荐）

### 在服务器上执行

```bash
# 1. 下载部署脚本
curl -o deploy.sh https://raw.githubusercontent.com/YOUR_USERNAME/lego-price-king/main/deploy.sh

# 或直接复制脚本内容到服务器
# 2. 给脚本执行权限
chmod +x deploy.sh

# 3. 运行脚本
sudo bash deploy.sh
```

## 📝 手动部署步骤

### 步骤 1: SSH 连接

在 Cursor 终端中：

```powershell
ssh root@8.138.110.247
```

### 步骤 2: 安装 Docker 和 Docker Compose

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose V2
apt install docker-compose-plugin -y

# 验证
docker --version
docker compose version
```

### 步骤 3: 克隆代码

```bash
# 安装 Git
apt install git -y

# 克隆仓库（替换 YOUR_USERNAME）
cd /opt
git clone https://github.com/YOUR_USERNAME/lego-price-king.git
cd lego-price-king
```

### 步骤 4: 配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑配置文件
nano .env
```

**在 nano 编辑器中填入以下内容**（根据实际情况修改）：

```env
# 数据库配置
DATABASE_URL="postgresql://postgres:YOUR_STRONG_PASSWORD@postgres:5432/lego_price_king?schema=public"

# 阿里云 OSS
ALIYUN_OSS_REGION="oss-cn-hangzhou"
ALIYUN_OSS_ACCESS_KEY_ID="你的OSS_ACCESS_KEY_ID"
ALIYUN_OSS_ACCESS_KEY_SECRET="你的OSS_ACCESS_KEY_SECRET"
ALIYUN_OSS_BUCKET="你的bucket名称"
ALIYUN_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"

# 淘宝联盟 API
TAOBAO_APP_KEY="你的淘宝APP_KEY"
TAOBAO_APP_SECRET="你的淘宝APP_SECRET"
TAOBAO_ADZONE_ID="你的ADZONE_ID"

# API 密钥（生成随机字符串）
API_SECRET_KEY="$(openssl rand -hex 32)"

# Next.js
NEXT_PUBLIC_APP_URL="http://8.138.110.247:3000"
```

**保存文件**：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

### 步骤 5: 启动项目

```bash
# 启动服务
docker compose up -d

# 等待服务启动（约 20 秒）
sleep 20

# 初始化数据库
docker compose exec app npx prisma generate
docker compose exec app npx prisma db push

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 步骤 6: 验证部署

在浏览器访问：
```
http://8.138.110.247:3000
```

## 🔧 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app
docker compose logs -f postgres

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新代码
cd /opt/lego-price-king
git pull
docker compose up -d --build
```

## ⚠️ 故障排查

### 无法访问网站

```bash
# 检查容器状态
docker compose ps

# 检查端口
netstat -tulpn | grep 3000

# 检查防火墙
ufw status
ufw allow 3000/tcp
```

### 数据库连接失败

```bash
# 检查数据库日志
docker compose logs postgres

# 检查数据库是否就绪
docker compose exec postgres pg_isready -U postgres
```

### 查看详细错误

```bash
# 查看所有日志
docker compose logs

# 进入容器调试
docker compose exec app sh
```

## 📋 检查清单

部署前确认：
- [ ] 防火墙已开放 3000 和 5432 端口
- [ ] 已获取阿里云 OSS 凭证
- [ ] 已获取淘宝联盟 API 凭证
- [ ] GitHub 仓库地址正确

部署后验证：
- [ ] 网站可以访问 http://8.138.110.247:3000
- [ ] 数据库容器运行正常
- [ ] 应用容器运行正常
- [ ] 日志无错误信息
