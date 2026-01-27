# 乐高比价王 - 项目上下文总结

> 本文档供新 Chat 快速了解项目背景和已完成的工作。  
> 项目路径：`C:\Users\Administrator\lego-price-king`  
> 服务器路径：`/opt/lego-price-king`

---

## 一、项目概述

**乐高比价王 (Lego Price King)**：乐高套装价格比较与追踪网站，支持电脑和手机访问。

- **生产环境**：阿里云 ECS (Ubuntu) + Docker Compose
- **管理方式**：本地 Windows 用 Node 脚本上传 Excel + 图片到远程 DB 和阿里云 OSS

---

## 二、技术栈

| 类别     | 技术                         |
|----------|------------------------------|
| 前端     | Next.js 14 (App Router) + Tailwind CSS + Shadcn UI |
| 数据库   | PostgreSQL（Docker）         |
| ORM      | Prisma                       |
| 图片存储 | 阿里云 OSS                   |
| 图表     | Recharts                     |
| 部署     | Docker Compose（App + Postgres） |

---

## 三、数据库模型 (Prisma)

**LegoSet**（表名 `lego_sets`）：

- `setNumber` (String, @id) - 套装编号
- `name` (String) - 名称
- `imageUrl` (String) - 图片链接（OSS）
- `theme` (String) - 主题
- `subTheme` (String?) - 子主题
- `year` (Int) - 年份
- `minifigs` (Int?) - 人仔数
- `lastPrice` (Float?) - 最近一次中位数价格
- `priceHistory` (Json?) - `[{date, price}, ...]`
- `createdAt`, `updatedAt`

---

## 四、页面与路由

| 路径              | 说明                           |
|-------------------|--------------------------------|
| `/`               | 首页：搜索框 +「乐高比价王」logo |
| `/search`         | 搜索页：网格展示结果           |
| `/set/[setNumber]`| 套装详情页（按手绘草图布局）   |

---

## 五、详情页布局（已按草图实现）

1. **顶部**：返回按钮（左上角）
2. **产品主信息**：
   - 大图居中
   - 下方左右两栏：
     - 左：编号、名称、人仔数
     - 右：主题、子主题、年份
3. **价格区**：「淘宝信价中位数」+ 金额 +「更新价格」按钮
4. **价格历史**：Recharts 折线图（X=日期，Y=价格）
5. **购买渠道**：Top 15 店铺列表，编号徽章 + 店名 + 价格 + 购买按钮

---

## 六、API

- **POST `/api/refresh-prices`**  
  - 作用：从淘宝联盟拉价 → 去掉最高/最低各 5 个 → 取中位数 → 更新 `lastPrice` 和 `priceHistory`  
  - 鉴权：query `key` 或 `Authorization: Bearer {key}`，对应 `API_SECRET_KEY`

- **`/api/stores`**  
  - 返回某套装的店铺/链接列表（供 StoreList 使用）

---

## 七、脚本（本地运行，连接远程）

| 脚本                     | 作用                                   |
|--------------------------|----------------------------------------|
| `scripts/sync_data.js`   | 读 Excel + 本地图片 → 上传 OSS → 同步到远程 PostgreSQL |
| `scripts/sync_custom_excel.js` | 支持自定义 Excel 列名的同步     |

- 配置：本地 `.env` 中的 `REMOTE_DATABASE_URL`、阿里云 OSS、淘宝等
- 数据目录：`data/excel/`、`data/images/`（已在 .gitignore，不提交）

---

## 八、部署要点（阿里云 ECS）

1. **项目在服务器上的位置**：`/opt/lego-price-king`（不是 `/root`）
2. **必须先进入项目目录**：`cd /opt/lego-price-king`，再执行 `cp`、`nano .env`、`docker compose` 等
3. **典型流程**：
   - `git clone` 到 `/opt/lego-price-king`
   - `cp .env.example .env`，`nano .env` 填好
   - `docker compose up -d`
   - `docker compose exec app npx prisma generate` 与 `npx prisma db push`
4. **防火墙**：开放 3000（应用）、5432（Postgres，供本地脚本连接）

---

## 九、重要文件结构

```
lego-price-king/
├── app/
│   ├── page.tsx                 # 首页
│   ├── layout.tsx
│   ├── search/page.tsx
│   ├── set/[setNumber]/page.tsx # 详情页
│   └── api/
│       ├── refresh-prices/route.ts
│       └── stores/route.ts
├── components/
│   ├── PriceChart.tsx
│   ├── StoreList.tsx
│   └── RefreshPriceButton.tsx
├── lib/prisma.ts, utils.ts, priceHistory.ts
├── prisma/schema.prisma
├── scripts/sync_data.js, sync_custom_excel.js
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## 十、代码仓库与文档

- **GitHub**：`lego-price-king`（用户已推送）
- **文档**：`README.md`、`DEPLOYMENT.md`、`GITHUB_UPLOAD.md`、`FIX_STEPS.md`、`TROUBLESHOOTING.md` 等

---

## 十一、已知注意点

1. **淘宝联盟**：`/api/refresh-prices` 中的 `fetchTaobaoPrices` 需按实际联盟 API 实现与调试。
2. **不要提及「Jimukong」**（需求中的明确约束）。
3. **Postgres 数据持久化**：docker-compose 中已为 Postgres 配置 volume，重启不丢数据。

---

*最后更新：基于 agent-transcripts 95e02967 的对话整理。*
