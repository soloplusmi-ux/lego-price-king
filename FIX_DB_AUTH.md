# 修复数据库认证错误（含 Application error: a server-side exception）

报错示例（日志或页面 Digest）：

```
Authentication failed against database server at `postgres`, 
the provided database credentials for `postgres` are not valid.
```
或页面显示：**Application error: a server-side exception has occurred (Digest: 1004931705)**

表示 **app 容器** 用 `DATABASE_URL` 连接 **postgres 容器** 时，`postgres` 用户的密码不被数据库接受。  
**所有需要查库的页面**（首页除外的 `/search`、`/set/xxx`、以及「更新价格」）都会报错。

---

## 原因说明

- `docker-compose` 里 app 的 `DATABASE_URL` 为：  
  `postgresql://postgres:postgres@postgres:5432/lego_price_king?schema=public`  
  （若 `.env` 有 `POSTGRES_PASSWORD`，会用来替换 `postgres` 密码部分）
- 数据库里的 `postgres` 用户密码，是在**首次建库**时由 `POSTGRES_PASSWORD` 写死的；之后改 `docker-compose` 或 `.env` 不会自动改库里已有用户的密码。
- 若曾经用过别的密码（或没统一），就会出现「app 认为的密码」和「库里 postgres 的实际密码」不一致，从而认证失败。

---

## 在服务器上执行的命令（按顺序）

### 1. 进入项目目录

```bash
cd /opt/lego-price-king
```

（如你的项目不在 `/opt/lego-price-king`，请改成实际路径。）

---

### 2. 把库里 postgres 的密码改成与 compose 一致

`docker exec ... psql -U postgres` 是**进 postgres 容器、用本机 socket 连库**，一般不需要密码即可执行。

**若不确认为何密码不对，先看 app 实际用的密码：**

```bash
docker exec lego_price_king_app printenv DATABASE_URL
```

连接串里 `postgres:密码@` 的「密码」即当前生效值（来自 `.env` 的 `POSTGRES_PASSWORD` 或默认 `postgres`）。下面 `ALTER USER` 请设成**与之一致**。

**默认情况（`.env` 未设置 `POSTGRES_PASSWORD` 或即为 `postgres`）：**

```bash
docker exec -it lego_price_king_db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
```

**若你在 `.env` 里设置了 `POSTGRES_PASSWORD=你的密码`：**

把上面命令里的 `'postgres'` 换成该密码，例如：

```bash
docker exec -it lego_price_king_db psql -U postgres -c "ALTER USER postgres PASSWORD '你的密码';"
```

---

### 3. 重启 app 容器

```bash
docker compose up -d
```

或（旧版命令）：

```bash
docker-compose up -d
```

---

### 4. 验证

- 再打开套装详情页，点一次「更新价格」。
- 若不再出现上述认证错误，且能看到「价格已更新」和「购买渠道」列表，说明数据库认证已修复。

---

## 若仍然报错

1. **确认 postgres 容器在跑：**  
   `docker ps | grep lego_price_king_db`

2. **确认 app 使用的 `DATABASE_URL`：**  
   `docker exec lego_price_king_app printenv DATABASE_URL`  
   看其中 `postgres:xxx@` 的密码是否与你在第 2 步 `ALTER USER ... PASSWORD '...'` 设的**完全一致**（注意多余空格、引号）。

3. **看 app 日志：**  
   `docker compose logs app --tail 80`

4. **若 `psql` 无法执行或你接受清空数据库重建：**  
   ```bash
   docker compose down -v
   ```
   会删除 `postgres_data` 卷。然后按需在 `.env` 中设置 `POSTGRES_PASSWORD=postgres`（或自设密码），再：
   ```bash
   docker compose up -d
   docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -f - < prisma/init-lego_sets.sql
   ```
   表会重新建好，但**原有数据会丢失**，需重新导入。
