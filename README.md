# 乐高比价王 (Lego Price King)

一个现代化的乐高套装价格比较和追踪平台，支持电脑和手机访问。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + Shadcn UI
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **图片存储**: 阿里云 OSS
- **部署**: Docker Compose
- **图表**: Recharts

## 项目结构

```
lego-price-king/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── search/           # 搜索页面
│   ├── set/              # 套装详情页
│   ├── layout.tsx        # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/            # React 组件
│   ├── PriceChart.tsx    # 价格图表
│   ├── StoreList.tsx     # 店铺列表
│   └── RefreshPriceButton.tsx  # 价格刷新按钮
├── lib/                  # 工具函数
│   ├── prisma.ts         # Prisma 客户端
│   └── utils.ts          # 通用工具
├── prisma/               # Prisma 配置
│   └── schema.prisma     # 数据库模型
├── scripts/              # 本地脚本
│   ├── sync_data.js      # 数据同步脚本
│   └── package.json      # 脚本依赖
├── data/                 # 本地数据（不上传）
│   ├── excel/           # Excel 文件
│   └── images/          # 图片文件
├── docker-compose.yml    # Docker Compose 配置
├── Dockerfile            # Docker 镜像配置
└── package.json          # 项目依赖
```

## 快速开始

### 1. 服务器端部署 (阿里云 ECS)

#### 1.1 安装 Docker 和 Docker Compose

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 1.2 上传项目文件

```bash
# 在服务器上创建项目目录
mkdir -p /opt/lego-price-king
cd /opt/lego-price-king

# 使用 scp 或 git 上传项目文件
# scp -r . user@your-server:/opt/lego-price-king/
```

#### 1.3 配置环境变量

```bash
# 创建 .env 文件
nano .env
```

在 `.env` 文件中配置：

```env
# 数据库配置
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

# API 密钥
API_SECRET_KEY="your-secret-key-here-change-in-production"

# Next.js 配置
NEXT_PUBLIC_APP_URL="http://your-server-ip:3000"
```

#### 1.4 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

#### 1.5 配置防火墙

```bash
# 开放 3000 端口（应用）和 5432 端口（数据库，仅用于本地脚本连接）
sudo ufw allow 3000/tcp
sudo ufw allow 5432/tcp
```

### 2. 本地开发环境

#### 2.1 安装依赖

```bash
cd lego-price-king
npm install
```

#### 2.2 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

#### 2.3 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库结构（开发环境）
npm run db:push

# 或使用迁移（生产环境推荐）
npm run db:migrate
```

#### 2.4 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 本地数据同步脚本

#### 3.1 准备数据

1. **Excel 文件**: 将数据放在 `data/excel/lego_sets.xlsx`
   - 必需列: `setNumber` (编号), `name` (名称), `theme` (主题), `year` (年份)
   - 可选列: `subTheme` (子主题), `minifigs` (人仔数), `imageUrl` (图片链接)

2. **图片文件**: 将图片放在 `data/images/` 目录
   - 文件名格式: `{setNumber}.jpg` 或 `{setNumber}.png`
   - 例如: `10294.jpg`, `75192.png`

#### 3.2 配置远程连接

在项目根目录的 `.env` 文件中添加：

```env
# 远程数据库连接（用于同步脚本）
REMOTE_DATABASE_URL="postgresql://postgres:postgres@your-server-ip:5432/lego_price_king?schema=public"
```

**注意**: 确保服务器防火墙允许从您的 IP 访问 5432 端口。

#### 3.3 安装脚本依赖

```bash
cd scripts
npm install
```

#### 3.4 运行同步脚本

```bash
# 在项目根目录运行
node scripts/sync_data.js
```

脚本会：
1. 读取 Excel 文件
2. 上传图片到阿里云 OSS
3. 将数据同步到远程数据库

## 数据库模型

### LegoSet (乐高套装)

- `setNumber` (String, Primary Key) - 套装编号
- `name` (String) - 名称
- `imageUrl` (String) - 图片链接 (OSS URL)
- `theme` (String) - 主题
- `subTheme` (String?) - 子主题
- `year` (Int) - 年份
- `minifigs` (Int?) - 人仔数
- `lastPrice` (Float?) - 最近一次的中位数价格
- `priceHistory` (Json?) - 历史价格数据 `[{date, price}, ...]`

## API 接口

### POST /api/refresh-prices

刷新指定套装的价格信息。

**参数**:
- `setNumber` (query) - 套装编号
- `key` (query) 或 `Authorization: Bearer {key}` - API 密钥

**响应**:
```json
{
  "success": true,
  "medianPrice": 299.50,
  "stores": [
    {
      "shopName": "店铺名称",
      "price": 299.50,
      "affiliateLink": "https://..."
    }
  ]
}
```

## 功能特性

- ✅ 响应式设计（支持电脑和手机）
- ✅ 搜索功能
- ✅ 价格历史图表
- ✅ 实时价格更新
- ✅ 多店铺比价
- ✅ 数据同步脚本
- ✅ Docker 部署

## 维护

### 查看日志

```bash
# 应用日志
docker-compose logs -f app

# 数据库日志
docker-compose logs -f postgres
```

### 备份数据库

```bash
# 在服务器上执行
docker-compose exec postgres pg_dump -U postgres lego_price_king > backup.sql
```

### 恢复数据库

```bash
docker-compose exec -T postgres psql -U postgres lego_price_king < backup.sql
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 故障排除

### 数据库连接失败

1. 检查防火墙是否开放 5432 端口
2. 检查 `docker-compose.yml` 中的端口映射
3. 验证数据库密码是否正确

### 图片上传失败

1. 检查阿里云 OSS 配置是否正确
2. 验证 OSS Access Key 权限
3. 检查网络连接

### 价格更新失败

1. 检查淘宝联盟 API 配置
2. 验证 API 密钥是否正确
3. 查看服务器日志

## 许可证

MIT
