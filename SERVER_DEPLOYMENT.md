# 服务器部署完整指南

## 前提条件

- ✅ 阿里云 ECS Ubuntu 服务器
- ✅ 防火墙已开放 3000 和 5432 端口
- ✅ 代码已在 GitHub 仓库 `lego-price-king`
- ✅ 服务器 IP: 8.138.110.247

## 步骤 1: SSH 连接到服务器

### 在 Cursor 终端中执行

```powershell
# 使用密码登录（首次连接）
ssh root@8.138.110.247

# 或使用密钥登录（如果已配置）
ssh -i ~/.ssh/your_key.pem root@8.138.110.247

# 如果使用非 root 用户
ssh your_username@8.138.110.247
```

**提示**：
- 首次连接会提示确认主机密钥，输入 `yes`
- 输入服务器密码（输入时不会显示）
- 连接成功后，终端提示符会变为 `root@your-server:~#`

## 步骤 2: 一键安装 Docker 和 Docker Compose

### 方法 1: 使用官方安装脚本（推荐）

在服务器上执行以下命令：

```bash
# 更新系统包
apt update && apt upgrade -y

# 安装 Docker（官方脚本）
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 将当前用户添加到 docker 组（避免每次使用 sudo）
usermod -aG docker $USER

# 安装 Docker Compose V2（作为 Docker 插件）
apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version

# 测试 Docker
docker run hello-world
```

### 方法 2: 手动安装（如果方法 1 失败）

```bash
# 更新系统
apt update && apt upgrade -y

# 安装依赖
apt install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker
systemctl start docker
systemctl enable docker

# 验证
docker --version
docker compose version
```

## 步骤 3: 克隆代码从 GitHub

```bash
# 安装 Git（如果未安装）
apt install git -y

# 创建项目目录
mkdir -p /opt
cd /opt

# 克隆仓库（公开仓库）
git clone https://github.com/YOUR_USERNAME/lego-price-king.git

# 或使用 SSH（如果已配置 SSH 密钥）
# git clone git@github.com:YOUR_USERNAME/lego-price-king.git

# 进入项目目录
cd lego-price-king

# 查看文件
ls -la
```

**注意**：将 `YOUR_USERNAME` 替换为您的 GitHub 用户名。

## 步骤 4: 配置环境变量

### 创建 .env 文件

```bash
# 在项目目录下
cd /opt/lego-price-king

# 复制示例文件
cp .env.example .env

# 编辑 .env 文件
nano .env
```

### 填写环境变量

在编辑器中填入以下内容（根据您的实际配置修改）：

```env
# 数据库配置（Docker 内部网络）
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@postgres:5432/lego_price_king?schema=public"

# 阿里云 OSS 配置
ALIYUN_OSS_REGION="oss-cn-hangzhou"
ALIYUN_OSS_ACCESS_KEY_ID="your-oss-access-key-id"
ALIYUN_OSS_ACCESS_KEY_SECRET="your-oss-access-key-secret"
ALIYUN_OSS_BUCKET="your-bucket-name"
ALIYUN_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"

# 淘宝联盟 API 配置
TAOBAO_APP_KEY="your-taobao-app-key"
TAOBAO_APP_SECRET="your-taobao-app-secret"
TAOBAO_ADZONE_ID="your-adzone-id"

# API 密钥（用于保护价格刷新接口）
API_SECRET_KEY="your-very-secure-random-string-here"

# Next.js 配置
NEXT_PUBLIC_APP_URL="http://8.138.110.247:3000"
```

**重要提示**：
- 将 `YOUR_DB_PASSWORD` 替换为强密码（建议使用随机字符串）
- 填入您的阿里云 OSS 凭证
- 填入淘宝联盟 API 凭证
- `API_SECRET_KEY` 使用强随机字符串（可以使用 `openssl rand -hex 32` 生成）

### 保存文件

在 nano 编辑器中：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

## 步骤 5: 启动项目

### 启动 Docker Compose

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 启动所有服务（后台运行）
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 初始化数据库

```bash
# 等待数据库启动（约 10-20 秒）
sleep 20

# 初始化数据库结构
docker compose exec app npx prisma generate
docker compose exec app npx prisma db push
```

### 检查服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看应用日志
docker compose logs app

# 查看数据库日志
docker compose logs postgres

# 检查端口监听
netstat -tulpn | grep -E '3000|5432'
```

## 步骤 6: 验证部署

### 在浏览器中访问

打开浏览器，访问：
```
http://8.138.110.247:3000
```

应该能看到"乐高比价王"首页。

### 检查服务健康状态

```bash
# 检查应用容器
docker compose exec app curl http://localhost:3000

# 检查数据库连接
docker compose exec postgres pg_isready -U postgres
```

## 常见问题排查

### 问题 1: 无法访问网站

```bash
# 检查防火墙
ufw status
# 确保 3000 端口已开放
ufw allow 3000/tcp

# 检查容器是否运行
docker compose ps

# 查看应用日志
docker compose logs app
```

### 问题 2: 数据库连接失败

```bash
# 检查数据库容器
docker compose logs postgres

# 检查数据库是否就绪
docker compose exec postgres pg_isready -U postgres

# 检查环境变量
docker compose exec app env | grep DATABASE_URL
```

### 问题 3: 容器启动失败

```bash
# 查看详细错误
docker compose logs

# 重新构建并启动
docker compose down
docker compose up -d --build

# 检查磁盘空间
df -h
```

### 问题 4: 端口被占用

```bash
# 检查端口占用
lsof -i :3000
lsof -i :5432

# 如果被占用，停止占用进程或修改 docker-compose.yml 中的端口映射
```

## 后续维护命令

```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷（危险！会删除数据库数据）
docker compose down -v

# 重启服务
docker compose restart

# 更新代码
cd /opt/lego-price-king
git pull
docker compose up -d --build

# 查看实时日志
docker compose logs -f app

# 进入容器调试
docker compose exec app sh
docker compose exec postgres psql -U postgres -d lego_price_king
```

## 安全建议

1. **修改数据库密码**：使用强密码
2. **配置防火墙**：只开放必要端口
3. **定期备份**：备份数据库数据
4. **更新系统**：定期 `apt update && apt upgrade`
5. **使用非 root 用户**：创建专用用户运行服务

## 一键部署脚本

我还会创建一个自动化脚本，可以一键执行所有步骤。
