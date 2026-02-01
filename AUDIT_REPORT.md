# 乐高比价王 - 服务器与淘宝联盟 API 审计报告

> 审计时间：2025-02-01  
> 审计范围：淘宝联盟 API、数据库、API 路由、安全、冗余数据与文档

---

## 一、淘宝联盟 API 审计 ✅

### 1.1 接口使用正确性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 禁止 taobao.item.get（商家接口） | ✅ 通过 | 项目中未使用，普通开发者无权限会报 Code 11 |
| 使用淘宝客接口 | ✅ 通过 | 已使用 `taobao.tbk.dg.material.optional`（物料搜索）+ `taobao.tbk.item.info.get`（商品详情） |
| 签名与请求格式 | ✅ 通过 | 按 TOP 文档实现 MD5 签名、中国时区时间戳、POST 到 eco.taobao.com |
| 超时与错误处理 | ✅ 通过 | 15 秒超时、AbortController、错误回退到模拟数据 |

### 1.2 淘宝 API 流程

```
物料搜索 (tbk.dg.material.optional) → 取 item_id
    ↓
商品详情 (tbk.item.info.get) → 取价格 zk_final_price
    ↓
计算中位数、Top 15 店铺
```

### 1.3 环境变量

- `TAOBAO_APP_KEY`、`TAOBAO_APP_SECRET`、`TAOBAO_ADZONE_ID` 未配置时自动回退模拟数据
- 详见 `TAOBAO_SETUP_GUIDE.md`

---

## 二、发现的 Bug 与修复

### 2.1 已修复：`parsePriceHistory` 丢失字符串价格

**问题**：数据库 JSON 中 `price` 若为字符串（如 `"305.00"`），原逻辑只接受 `typeof priceValue === 'number'`，导致该价格点被丢弃。

**修复**：`lib/priceHistory.ts` 已更新为兼容 `number` 与 `string` 两种类型。

### 2.2 低风险：Next.js 15 升级兼容性

**说明**：当前使用 Next.js 14，`params` 和 `searchParams` 为同步对象。若将来升级到 Next.js 15，需改为：

```tsx
// set/[setNumber]/page.tsx
const { setNumber } = await params;

// search/page.tsx
const searchParams = await searchParamsProp;  // 若 Next 15 传入 Promise
```

---

## 三、不当实践与冗余

### 3.1 `/api/stores` 死代码

- **现状**：该接口始终返回 `{ stores: [] }`，前端 **StoreList** 未调用此接口
- **数据流**：店铺数据来自「更新价格」接口 `/api/refresh-prices` 的响应，通过 `window.updateStores_xxx` 回调更新
- **建议**：删除该路由，或按 TODO 实现「刷新价格时持久化店铺到数据库」后再启用

### 3.2 DATABASE_URL 连接池参数重复

- **现状**：`docker-compose.yml` 与 `lib/prisma.ts` 都设置了 `connection_limit`、`pool_timeout`、`connect_timeout`
- **结果**：`prisma.ts` 后追加的参数会覆盖前者，功能正常，但配置重复
- **建议**：只在一处配置（建议保留 `prisma.ts` 中的配置，从 docker-compose 中移除连接池参数）

### 3.3 价格刷新接口无鉴权

- **现状**：`/api/refresh-prices` 不校验 API 密钥，任何人可调用
- **影响**：可被恶意频繁调用，触发淘宝 API 和数据库写操作
- **建议**：若对外开放，建议在 Nginx/反向代理层做限流或 IP 白名单；或恢复 `API_SECRET_KEY` 校验

---

## 四、数据库与 Prisma

### 4.1 Schema 与数据

| 检查项 | 状态 |
|--------|------|
| LegoSet 模型设计 | ✅ 合理 |
| priceHistory JSON 结构 | ✅ 为 `[{date, price}]` |
| 无冗余表或字段 | ✅ 通过 |

### 4.2 连接稳定性

- ✅ 已使用 `withRetry()` 包装所有 Prisma 查询
- ✅ 连接错误自动重连（P1001、P1008、P1017 等）
- ✅ 搜索页、套装页、refresh-prices 均已接入重试

---

## 五、文档冗余

### 5.1 文档数量

项目根目录约 **58 个 .md 文件**，其中大量为历史修复记录：

- `FIX_*.md`（约 20+）
- `*_GUIDE.md`、`*_FIX.md` 等存在内容重叠

### 5.2 建议保留的核心文档

| 文档 | 用途 |
|------|------|
| README.md | 项目介绍 |
| TAOBAO_SETUP_GUIDE.md | 淘宝联盟接入 |
| DEPLOYMENT.md / QUICK_DEPLOY.md | 部署说明 |
| TROUBLESHOOTING.md | 故障排查 |
| DATABASE_PERSISTENCE.md | 数据持久化 |
| AUDIT_REPORT.md | 本审计报告 |

### 5.3 建议归档或删除

- 各类 `FIX_*.md`、`*_FIX.md` 可合并到 `TROUBLESHOOTING.md` 或 `docs/archive/` 目录
- 重复的部署/更新文档可合并为一个

---

## 六、安全与配置检查

| 检查项 | 状态 |
|--------|------|
| .env 未提交到 Git | ✅ 由 .gitignore 排除 |
| .env.example 无敏感信息 | ✅ 仅占位符 |
| 图片域名白名单 (aliyuncs.com) | ✅ next.config.js 已配置 |

---

## 七、审计结论与建议

### 7.1 结论

- 淘宝联盟 API 使用正确，未使用 `taobao.item.get`
- 数据库连接有重试与重连，逻辑合理
- 已修复 `parsePriceHistory` 对字符串价格的兼容问题
- 存在少量死代码、配置重复和文档冗余

### 7.2 优先建议

1. **高**：保留当前 `parsePriceHistory` 修复
2. **中**：删除或实现 `/api/stores`，避免误导
3. **中**：合并/归档冗余 FIX 文档
4. **低**：统一 DATABASE_URL 连接池配置到单一位置
5. **低**：若对外暴露，为价格刷新接口增加限流或鉴权

---

*审计人：AI 助手 | 项目：乐高比价王 (lego-price-king)*
