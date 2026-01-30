# 数据库持久化说明（一劳永逸）

本文档说明乐高比价王项目如何保证 **PostgreSQL 数据一直保留**，重启服务器或长时间不用后也不会丢数据。

---

## 1. 数据存在哪里

- **PostgreSQL 数据**（乐高套装、价格历史等）保存在 Docker **命名卷** `lego_price_king_postgres_data` 中。
- 该卷名在 `docker-compose.yml` 中**固定**，不会随项目目录名或 `docker compose` 项目名变化。
- 只要不**手动删除**该卷，数据会一直保留；重启服务器、`docker compose restart`、`git pull` 后重建 app 都不会清空数据。

---

## 2. 为什么之前会“丢库”

常见原因与对应修复如下：

| 原因 | 说明 | 当前处理 |
|------|------|----------|
| **卷名随项目名变化** | 从不同目录或不同项目名启动时，Docker 会生成不同卷名（如 `lego-price-king_postgres_data` vs `lego_price_king_postgres_data`），相当于换了“新盘”，旧数据还在旧卷里。 | 已固定卷名为 `lego_price_king_postgres_data`，任意目录启动都用同一卷。 |
| **健康检查死锁** | Postgres 健康检查要求 `lego_price_king` 库已存在，但该库由 app 启动时创建；app 又等 Postgres 健康后才启动 → 永远等不到健康。 | 健康检查改为只检查 Postgres 进程是否就绪（不检查具体库），app 启动后再创建/确认库。 |
| **执行了 `docker compose down -v`** | `-v` 会删除所有 compose 里声明的卷，包括 `postgres_data`，数据会被清空。 | 文档和 compose 内注释明确：**严禁**在需要保留数据时使用 `-v`。 |

---

## 3. 正确操作方式

### 日常更新代码（不丢数据）

```bash
cd /opt/lego-price-king
git pull origin main
docker compose up -d --build
```

- **不要**使用：`docker compose down -v` 或 `docker volume rm lego_price_king_postgres_data`（除非你确定要清空数据）。

### 只重启服务（不丢数据）

```bash
docker compose restart
# 或
docker compose restart app
```

### 停止服务但保留数据

```bash
docker compose stop
# 或
docker compose down
```

- 使用 `down` 时**不要加 `-v`**。

### 确要清空数据库并重新开始

```bash
docker compose down -v
docker compose up -d --build
```

- 之后需要重新导入乐高数据（Excel/脚本等）。

---

## 4. 启动时数据库如何被“确认”

1. **Postgres** 先启动，健康检查只检查 `pg_isready -U postgres`（进程就绪即可）。
2. **App** 在 Postgres 健康后启动，启动脚本会：
   - 连接默认库 `postgres`，执行 `CREATE DATABASE lego_price_king;`（若已存在会报错，脚本忽略）。
   - 执行 `prisma generate` 和 `prisma db push`，保证表结构存在。
   - 启动 Node 应用。
3. 因此无论卷是新建还是已有数据，**库都会存在**，应用都能连上同一套数据。

---

## 5. 如何确认数据卷存在且未删

在服务器上执行：

```bash
docker volume ls | grep lego_price_king_postgres_data
```

应能看到一行 `lego_price_king_postgres_data`。若看不到，说明卷已被删除，需要重新建库并重新导入数据。

---

## 6. 小结

- **数据卷**：固定名 `lego_price_king_postgres_data`，一直保留，除非你主动删卷。
- **更新/重启**：用 `git pull` + `docker compose up -d --build` 或 `docker compose restart`，**不要**用 `docker compose down -v`。
- **健康检查**：只检查 Postgres 是否就绪，库由 app 启动时创建/确认，避免“等库存在才健康、等健康才建库”的死锁。
- 按上述方式操作后，数据库会**一劳永逸**保留，只有在你执行 `down -v` 或 `volume rm` 时才会被清空。
