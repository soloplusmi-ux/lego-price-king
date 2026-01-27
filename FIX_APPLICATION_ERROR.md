# 排查 "Application error: a server-side exception has occurred"

当页面出现 `Application error: a server-side exception has occurred (Digest: xxxxx)` 时，**必须先看服务端日志**才能确定根因。`Digest: 1004931705` 这类编号是 Next.js 的错误摘要，无法直接据此查找；具体原因只在**应用容器的标准输出/日志**里。按下面步骤操作。

---

## 1. 在服务器上查看 App 容器日志（必做）

在项目目录（如 `/opt/lego-price-king`）执行：

```bash
docker compose logs app --tail 200
```

或按容器名：

```bash
docker logs lego_price_king_app --tail 200
```

把**完整输出**（尤其是报错堆栈，如 `Error: ...`、`at ...`）保存下来，后续排查或发给他人时要用到。

---

## 2. 用健康检查区分「应用是否起来」和「页面是否报错」

- 在浏览器或本机 `curl` 访问：  
  `http://你的域名或IP:3000/api/health`
- 若返回 `{"ok":true,"service":"lego-price-king",...}`：说明 Next.js 和容器正常，问题多半在**具体页面或 Prisma/数据库**。
- 若 `/api/health` 也打不开或 5xx：可能是端口、反向代理、或 Next 进程本身起不来，需结合 `docker compose logs app` 排查。

---

## 3. 根据日志里常见错误做对应处理

### 3.1 数据库连接 / Prisma 相关

**表现**：日志里有  
`Can't reach database server`、`P1001`、`connection refused`、`password authentication failed`、`the provided database credentials for postgres are not valid`、`Authentication failed against database server at postgres`、`does not exist` 等。

**若为「Authentication failed」或「credentials are not valid」**：  
→ 直接按 **[FIX_DB_AUTH.md](./FIX_DB_AUTH.md)**：在 postgres 容器内执行 `ALTER USER postgres PASSWORD '...'`，使密码与 `POSTGRES_PASSWORD`（或 `DATABASE_URL` 中的密码）一致，然后重启 app。

**其它 DB 问题的处理**：

1. **确认 `DATABASE_URL` 在容器内正确**  
   - 在 docker-compose 里，应用要连的是**同一 compose 里的 postgres 服务**，主机名必须用 `postgres`，不能用 `localhost`。  
   - 正确示例：  
     `postgresql://postgres:你的密码@postgres:5432/lego_price_king?schema=public`  
   - 若在 `.env` 里配了 `DATABASE_URL`，注意：compose 里 `environment` 的 `DATABASE_URL` 会覆盖 `env_file` 中的同名变量；如果 compose 里没有写 `DATABASE_URL`，则会用 `.env` 的，此时**.env 里不能写 `@localhost`**，要改成 `@postgres`（并保证在 compose 网络内）。

2. **确认数据库和表已建好**  
   - 库名需为 `lego_price_king`（或你 `DATABASE_URL` 里写的库名）。  
   - 表需存在且与 `prisma/schema.prisma` 一致，可执行：  
     ```bash
     docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -f - < prisma/init-lego_sets.sql
     ```  
   - 或：  
     ```bash
     npx prisma db push
     ```  
     （若在宿主机跑，需 `DATABASE_URL=postgresql://postgres:密码@localhost:5432/lego_price_king` 能通。）

3. **Prisma Client 与运行环境一致**  
   - 容器启动命令里已有：  
     `npx prisma generate --schema=./prisma/schema.prisma && node server.js`  
   - 若你改过 `schema` 或 Node 版本，建议：  
     - 重新构建镜像：`docker compose build --no-cache app`  
     - 再：`docker compose up -d app`

---

### 3.2 表不存在或字段不匹配

**表现**：`relation "lego_sets" does not exist`、`column "xxx" does not exist` 等。

**处理**：  
- 用上面 3.1 的 `init-lego_sets.sql` 或 `prisma db push` 建表/同步结构。  
- 若你改过 `prisma/schema.prisma`，在**构建镜像的环境**里执行一次 `npx prisma generate`，并重新 build 镜像。

---

### 3.3 模块找不到（Module not found、Can't resolve）

**表现**：`Module not found: Can't resolve '@/...'` 或某个 `node_modules` 里的包。

**处理**：  
- 确认该文件已提交并推送到 Git，服务器 `git pull` 后存在。  
- 本地 `npm run build` 能通过，再在服务器上：  
  `docker compose build --no-cache app && docker compose up -d app`  
- 若 `Dockerfile` 或 `docker-compose` 里改了 `COPY` 或 `node_modules` 的安装方式，确保 `@prisma/client`、`next` 等依赖在镜像里存在。

---

### 3.4 其它运行时异常（如 JSON 解析、权限、第三方 API）

**表现**：日志里有明确的 `Error`、`TypeError`、`at parsePriceHistory`、`at getLegoSet` 等堆栈。

**处理**：  
- 根据堆栈中的**文件名和行号**找到对应代码（`app/set/...`、`app/search/...`、`lib/priceHistory`、`app/api/refresh-prices/route.ts` 等）。  
- 若是 `parsePriceHistory`、`priceHistory`：检查库里 `priceHistory` 字段是否为合法 JSON 数组；若有脏数据，可先在库里改为 `[]` 或 `null` 再试。  
- 若是 `/api/refresh-prices` 里淘宝接口：查 `TAOBAO_SETUP_GUIDE.md`，确认 `TAOBAO_APP_KEY`、`TAOBAO_APP_SECRET`、`TAOBAO_ADZONE_ID` 在 `.env` 中正确，且容器能访问外网。

---

## 4. 建议的排查顺序（摘要）

| 步骤 | 命令/操作 |
|------|-----------|
| 1 | `docker compose logs app --tail 200` → 保存完整报错 |
| 2 | 访问 `http://IP:3000/api/health`，看是否 200 且 `ok:true` |
| 3 | 访问 `http://IP:3000/`（首页）：若仅首页报错，少见，看日志；若首页正常，再访问 `/search`、`/set/某个编号` |
| 4 | 若日志有 DB/Prisma 相关：查 `DATABASE_URL`、建库建表、`prisma generate` 与镜像构建 |
| 5 | 若日志有 `lego_sets`/列不存在：执行 `init-lego_sets.sql` 或 `prisma db push` |
| 6 | 若日志有 `Module not found`：补全代码、`git push`、服务器 `git pull`、`docker compose build --no-cache app` |

---

## 5. 部署后请再次确认

- 本机修改过的文件（如 `app/api/health/route.ts`、`app/search/page.tsx`、`lib/prisma.ts`、`app/set/[setNumber]/page.tsx` 等）已 `git add`、`commit`、`push`。  
- 服务器上：`git pull` 后执行：  
  `docker compose up -d --build`  
  或：  
  `docker compose build --no-cache app && docker compose up -d app`  
- 若仍有 Application error，**把 `docker compose logs app --tail 200` 的完整输出**贴出来，才能进一步精确定位。
