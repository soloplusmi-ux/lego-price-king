# 项目结构说明

## 完整文件树

```
lego-price-king/
├── .env.example                 # 环境变量示例文件
├── .gitignore                   # Git 忽略文件
├── Dockerfile                   # Docker 镜像构建文件
├── docker-compose.yml           # Docker Compose 编排文件
├── next.config.js               # Next.js 配置文件
├── package.json                 # 项目依赖配置
├── postcss.config.js            # PostCSS 配置
├── README.md                    # 项目说明文档
├── DEPLOYMENT.md                # 部署指南
├── USAGE.md                     # 使用指南
├── PROJECT_STRUCTURE.md         # 本文件
├── tailwind.config.ts           # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置
│
├── app/                         # Next.js App Router 目录
│   ├── api/                     # API 路由
│   │   └── refresh-prices/
│   │       └── route.ts         # 价格刷新 API
│   ├── search/
│   │   └── page.tsx             # 搜索页面
│   ├── set/
│   │   └── [setNumber]/
│   │       └── page.tsx         # 套装详情页（动态路由）
│   ├── layout.tsx               # 根布局组件
│   ├── page.tsx                 # 首页
│   └── globals.css              # 全局样式
│
├── components/                  # React 组件目录
│   ├── PriceChart.tsx           # 价格历史图表组件
│   ├── RefreshPriceButton.tsx   # 价格刷新按钮组件
│   └── StoreList.tsx            # 店铺列表组件
│
├── lib/                         # 工具库目录
│   ├── prisma.ts                # Prisma 客户端单例
│   └── utils.ts                 # 通用工具函数
│
├── prisma/                      # Prisma 配置目录
│   └── schema.prisma            # 数据库模型定义
│
├── scripts/                     # 本地脚本目录
│   ├── package.json             # 脚本依赖配置
│   └── sync_data.js             # 数据同步脚本
│
└── data/                        # 本地数据目录（不上传到 Git）
    ├── excel/                   # Excel 文件目录
    │   └── lego_sets.xlsx       # 乐高套装数据文件
    └── images/                  # 图片文件目录
        └── *.jpg, *.png         # 套装图片文件
```

## 目录说明

### `/app`
Next.js 14 App Router 的核心目录，包含所有页面和 API 路由。

- `page.tsx`: 应用入口页面（首页）
- `layout.tsx`: 根布局，定义 HTML 结构和全局样式
- `globals.css`: 全局 CSS 样式和 Tailwind 配置
- `api/`: API 路由目录，所有后端接口都在这里
- `search/`: 搜索功能页面
- `set/[setNumber]/`: 动态路由，显示单个套装详情

### `/components`
可复用的 React 组件。

- `PriceChart.tsx`: 使用 Recharts 库绘制价格历史折线图
- `RefreshPriceButton.tsx`: 触发价格更新的按钮组件
- `StoreList.tsx`: 显示购买渠道列表的组件

### `/lib`
工具函数和配置。

- `prisma.ts`: Prisma 客户端实例，使用单例模式避免重复连接
- `utils.ts`: 通用工具函数（如 className 合并）

### `/prisma`
数据库相关配置。

- `schema.prisma`: Prisma 模型定义，描述数据库结构

### `/scripts`
本地运行的数据同步脚本。

- `sync_data.js`: 从 Excel 和图片文件夹同步数据到远程服务器
- `package.json`: 脚本的独立依赖配置

### `/data`
本地数据存储（不应提交到 Git）。

- `excel/`: 存放待同步的 Excel 文件
- `images/`: 存放待上传的图片文件

## 配置文件说明

### `docker-compose.yml`
定义 Docker 容器编排：
- `postgres`: PostgreSQL 数据库容器
- `app`: Next.js 应用容器
- 网络和卷配置

### `Dockerfile`
定义应用容器的构建过程：
- 多阶段构建（依赖安装 → 构建 → 运行）
- 优化镜像大小
- 配置运行环境

### `.env.example`
环境变量模板，包含：
- 数据库连接字符串
- 阿里云 OSS 配置
- 淘宝联盟 API 配置
- API 密钥

### `next.config.js`
Next.js 配置：
- 输出模式（standalone）
- 图片域名白名单

### `tailwind.config.ts`
Tailwind CSS 配置：
- 主题颜色
- 响应式断点
- 动画配置

## 数据流

### 数据同步流程
```
本地 Excel + 图片
    ↓
sync_data.js 脚本
    ↓
上传图片到阿里云 OSS
    ↓
获取 OSS URL
    ↓
连接远程 PostgreSQL
    ↓
Upsert 数据到数据库
```

### 价格更新流程
```
用户点击"更新价格"
    ↓
前端调用 /api/refresh-prices
    ↓
后端调用淘宝联盟 API
    ↓
获取价格列表
    ↓
计算中位数（去除最高/最低各5个）
    ↓
更新数据库（lastPrice + priceHistory）
    ↓
返回结果给前端
    ↓
前端刷新页面显示新数据
```

## 技术栈说明

- **Next.js 14**: React 框架，使用 App Router
- **TypeScript**: 类型安全
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Prisma**: 类型安全的 ORM
- **PostgreSQL**: 关系型数据库
- **Recharts**: React 图表库
- **Docker**: 容器化部署
- **阿里云 OSS**: 对象存储服务

## 扩展建议

如需添加新功能，建议：

1. **新页面**: 在 `/app` 下创建新目录和 `page.tsx`
2. **新组件**: 在 `/components` 下创建新组件文件
3. **新 API**: 在 `/app/api` 下创建新路由目录
4. **新模型**: 在 `prisma/schema.prisma` 中添加新模型
5. **新工具函数**: 在 `/lib` 下创建或扩展工具文件
