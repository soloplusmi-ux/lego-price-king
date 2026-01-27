# 重启服务器并验证新密钥与搜索功能

## 一、重启应用以加载新的 TAOBAO 密钥

在服务器上执行（确保已更新 `/opt/lego-price-king/.env` 中的 `TAOBAO_APP_KEY`、`TAOBAO_APP_SECRET`、`TAOBAO_ADZONE_ID`）：

```bash
cd /opt/lego-price-king
docker compose up -d
```

或（若需重新构建镜像）：

```bash
docker compose up -d --build
```

---

## 二、验证新密钥是否生效

```bash
docker exec lego_price_king_app printenv | grep TAOBAO
```

应看到新的 `TAOBAO_APP_KEY`、`TAOBAO_APP_SECRET`、`TAOBAO_ADZONE_ID`。

---

## 三、排查搜索页面的 Application error

### 1. 查看应用日志

```bash
docker compose logs app --tail 200
```

或：

```bash
docker logs lego_price_king_app --tail 200
```

**重点看**：
- 是否有 `Authentication failed`、`credentials are not valid`（数据库认证问题）
- 是否有 `relation "lego_sets" does not exist`（表不存在）
- 是否有 `at app/search/page.js` 或 `at getSearchResults` 的堆栈（搜索页具体错误）

### 2. 测试健康检查

```bash
curl http://localhost:3000/api/health
```

或浏览器访问：`http://你的服务器IP:3000/api/health`

应返回 `{"ok":true,"service":"lego-price-king",...}`。若也报错，说明 Next.js 进程或容器有问题。

### 3. 若日志显示数据库认证错误

按 **[FIX_DB_AUTH.md](./FIX_DB_AUTH.md)** 修复：

```bash
# 先看 app 用的密码
docker exec lego_price_king_app printenv DATABASE_URL

# 把 postgres 用户密码改成与 DATABASE_URL 一致（假设是 postgres）
docker exec -it lego_price_king_db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"

# 重启 app
docker compose up -d
```

### 4. 若日志显示表不存在

```bash
docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -f - < prisma/init-lego_sets.sql
```

---

## 四、验证「更新价格」是否可用

1. 打开任意套装详情页（例如 `/set/某个编号`）
2. 点击 **「更新价格」**
3. 查看：
   - 若显示 **「价格已更新: ¥xxx」** 且**没有**「⚠ 当前为模拟数据」：说明淘宝 API 已正常
   - 若仍有「⚠ 当前为模拟数据。xxx」：查看日志里的 `[淘宝价格] error_response:` 那一行，根据 `sub_code` 继续排查

---

## 五、快速检查清单

| 步骤 | 命令/操作 | 预期结果 |
|------|-----------|----------|
| 1. 重启应用 | `docker compose up -d` | 容器 Running |
| 2. 验证密钥 | `docker exec lego_price_king_app printenv \| grep TAOBAO` | 显示新的 Key/Secret/Adzone |
| 3. 健康检查 | `curl http://localhost:3000/api/health` | `{"ok":true,...}` |
| 4. 查看日志 | `docker compose logs app --tail 200` | 无 `Authentication failed` 等错误 |
| 5. 测试搜索 | 浏览器访问 `/search` 或 `/search?q=10246` | 显示结果列表，不报 Application error |
| 6. 测试更新价格 | 详情页点「更新价格」 | 显示真实价格或明确的错误原因 |

---

## 六、若搜索仍报 Application error

把 `docker compose logs app --tail 200` 的**完整输出**（尤其是包含 `Error:`、`at app/search`、`Authentication failed` 的部分）贴出来，便于精确定位。
