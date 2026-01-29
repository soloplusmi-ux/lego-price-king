# 空闲几小时后连接断开 — 已修复说明

## 现象

- 搜索、套装页用一段时间正常，**几小时不用后再用就报错**（Application error）
- 之前误以为需要：重新建库、重新上传数据、重新链接

## 原因

- 应用和 PostgreSQL 之间的 **TCP 连接** 在长时间无请求后，被网络或数据库端关闭（空闲超时）
- 下次请求仍用旧连接，就会报错
- **数据库和数据都还在**，只是“连接”断了

## 正确理解

- **不需要** 重新建立数据库  
- **不需要** 重新上传 Excel 数据  
- **只需要** 让应用在发现连接不可用时 **自动重连** 即可  

## 已做修改

1. **扩展“连接类错误”的识别**（`lib/prisma.ts`）  
   - 除原有 Prisma 错误码外，增加对以下情况的识别并触发重连：  
     - `Connection terminated` / `Connection closed`  
     - `ECONNRESET` / `socket hang up` / `broken pipe`  
     - `Invalid prisma.legoSet.findMany()` 等调用失败  
     - `PrismaClientInitializationError` 等  

2. **加强自动重连**  
   - 所有通过 `withRetry` 的查询：一旦出现上述错误，会先 `$disconnect()`，等待 1.5～4.5 秒后再 `$connect()` 并重试查询（最多 3 次）  
   - 搜索页、套装详情页、价格刷新接口都使用 `withRetry`，因此都会自动恢复  

3. **连接池参数**  
   - `connection_limit=5`，减少空闲连接数量  
   - `pool_timeout=30`、`connect_timeout=15`，给重连留出时间  

## 部署

```bash
cd /opt/lego-price-king
git pull
docker compose build --no-cache app
docker compose up -d
```

## 之后若再报错

- 先看应用日志里是否有 `[DB] 连接异常 ... 尝试重连` 和 `[DB] 重连失败`  
- 若仍有错误，把完整报错或截图发出来即可，**依然不需要** 重建数据库或重新上传数据。  
