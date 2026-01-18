# 快速开始指南

## 5 分钟快速部署

### 服务器端（阿里云 ECS）

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# 2. 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. 上传项目文件到 /opt/lego-price-king

# 4. 配置环境变量
cd /opt/lego-price-king
cp .env.example .env
nano .env  # 编辑配置

# 5. 启动服务
docker-compose up -d

# 6. 初始化数据库
docker-compose exec app npx prisma db push

# 7. 开放端口
ufw allow 3000/tcp
```

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 初始化数据库
npm run db:generate
npm run db:push

# 4. 启动开发服务器
npm run dev
```

### 数据同步

```bash
# 1. 准备数据
#    - 将 Excel 文件放在 data/excel/lego_sets.xlsx
#    - 将图片放在 data/images/

# 2. 配置远程数据库连接
#    在 .env 中添加: REMOTE_DATABASE_URL="postgresql://..."

# 3. 安装脚本依赖
cd scripts && npm install

# 4. 运行同步
cd ..
node scripts/sync_data.js
```

## 常见问题快速解决

**问题**: Docker 启动失败
```bash
docker-compose logs  # 查看日志
docker-compose down && docker-compose up -d  # 重启
```

**问题**: 数据库连接失败
```bash
# 检查数据库是否运行
docker-compose ps

# 检查端口
netstat -tulpn | grep 5432
```

**问题**: 图片上传失败
- 检查阿里云 OSS 配置
- 验证 Access Key 权限

## 下一步

- 阅读 [README.md](README.md) 了解完整功能
- 阅读 [DEPLOYMENT.md](DEPLOYMENT.md) 了解详细部署步骤
- 阅读 [USAGE.md](USAGE.md) 了解使用方法
