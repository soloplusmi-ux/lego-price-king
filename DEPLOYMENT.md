# 部署指南

## 服务器端部署步骤

### 步骤 1: 在阿里云 ECS 上安装 Docker

```bash
# SSH 连接到您的 ECS 服务器
ssh root@your-server-ip

# 更新系统包
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤 2: 上传项目文件

**方法 1: 使用 Git (推荐)**

```bash
# 在服务器上安装 Git
apt install git -y

# 克隆项目（如果使用 Git 仓库）
cd /opt
git clone your-repo-url lego-price-king
cd lego-price-king
```

**方法 2: 使用 SCP**

在本地机器上：

```bash
# 压缩项目（排除 node_modules）
tar -czf lego-price-king.tar.gz --exclude='node_modules' --exclude='.next' lego-price-king/

# 上传到服务器
scp lego-price-king.tar.gz root@your-server-ip:/opt/

# 在服务器上解压
ssh root@your-server-ip
cd /opt
tar -xzf lego-price-king.tar.gz
cd lego-price-king
```

### 步骤 3: 配置环境变量

```bash
# 创建 .env 文件
nano .env
```

复制以下内容并修改为您的实际配置：

```env
# 数据库配置（Docker 内部网络）
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/lego_price_king?schema=public"

# 阿里云 OSS 配置
ALIYUN_OSS_REGION="oss-cn-hangzhou"
ALIYUN_OSS_ACCESS_KEY_ID="your-access-key-id"
ALIYUN_OSS_ACCESS_KEY_SECRET="your-access-key-secret"
ALIYUN_OSS_BUCKET="your-bucket-name"
ALIYUN_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"

# 淘宝联盟 API 配置
TAOBAO_APP_KEY="your-taobao-app-key"
TAOBAO_APP_SECRET="your-taobao-app-secret"
TAOBAO_ADZONE_ID="your-adzone-id"

# API 密钥（用于保护价格刷新接口，请使用强密码）
API_SECRET_KEY="your-very-secure-secret-key-here"

# Next.js 配置
NEXT_PUBLIC_APP_URL="http://your-server-ip:3000"
```

**重要提示**:
- 将 `your-server-ip` 替换为您的实际服务器 IP
- 将 OSS 和淘宝 API 配置替换为您的实际凭证
- `API_SECRET_KEY` 应该是一个强随机字符串

### 步骤 4: 配置防火墙

```bash
# 安装 UFW（如果未安装）
apt install ufw -y

# 允许 SSH（重要！）
ufw allow 22/tcp

# 允许应用端口
ufw allow 3000/tcp

# 允许数据库端口（仅用于本地脚本连接，可选）
ufw allow 5432/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

### 步骤 5: 启动服务

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 步骤 6: 验证部署

1. 在浏览器访问: `http://your-server-ip:3000`
2. 应该能看到"乐高比价王"首页
3. 检查数据库连接: `docker-compose exec app npx prisma db push`

### 步骤 7: 设置自动启动（可选）

```bash
# 创建 systemd 服务文件
nano /etc/systemd/system/lego-price-king.service
```

添加以下内容：

```ini
[Unit]
Description=Lego Price King Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/lego-price-king
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
systemctl daemon-reload
systemctl enable lego-price-king.service
```

## 本地脚本配置

### 步骤 1: 配置远程数据库连接

在本地项目的 `.env` 文件中添加：

```env
# 远程数据库连接（用于同步脚本）
REMOTE_DATABASE_URL="postgresql://postgres:postgres@your-server-ip:5432/lego_price_king?schema=public"
```

**注意**: 
- 将 `your-server-ip` 替换为服务器 IP
- 确保服务器防火墙允许从您的 IP 访问 5432 端口
- 如果使用云服务，可能需要在安全组中开放端口

### 步骤 2: 准备数据文件

1. 创建数据目录：
```bash
mkdir -p data/excel
mkdir -p data/images
```

2. 将 Excel 文件放在 `data/excel/lego_sets.xlsx`

3. 将图片文件放在 `data/images/`，文件名格式为 `{setNumber}.jpg` 或 `{setNumber}.png`

### 步骤 3: 安装脚本依赖

```bash
cd scripts
npm install
```

### 步骤 4: 运行同步脚本

```bash
# 在项目根目录
node scripts/sync_data.js
```

## 常见问题

### 问题 1: Docker Compose 启动失败

**解决方案**:
```bash
# 查看详细错误
docker-compose logs

# 检查端口占用
netstat -tulpn | grep 3000
netstat -tulpn | grep 5432

# 停止并重新启动
docker-compose down
docker-compose up -d
```

### 问题 2: 无法连接到远程数据库

**检查清单**:
1. 服务器防火墙是否开放 5432 端口
2. 云服务商安全组是否允许访问
3. `REMOTE_DATABASE_URL` 配置是否正确
4. 数据库容器是否正常运行: `docker-compose ps`

### 问题 3: 图片上传失败

**解决方案**:
1. 检查阿里云 OSS 配置是否正确
2. 验证 Access Key 权限（需要 PutObject 权限）
3. 检查网络连接
4. 查看脚本错误信息

### 问题 4: 应用无法访问

**检查清单**:
1. 防火墙是否开放 3000 端口
2. 应用容器是否运行: `docker-compose ps`
3. 查看应用日志: `docker-compose logs app`
4. 检查 `.env` 文件配置

## 维护命令

```bash
# 查看所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
docker-compose logs -f postgres

# 重启服务
docker-compose restart app

# 停止所有服务
docker-compose down

# 停止并删除数据卷（危险！）
docker-compose down -v

# 更新应用
git pull
docker-compose up -d --build
```

## 备份和恢复

### 备份数据库

```bash
# 在服务器上执行
docker-compose exec postgres pg_dump -U postgres lego_price_king > backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
docker-compose exec -T postgres psql -U postgres lego_price_king < backup_20240101.sql
```
