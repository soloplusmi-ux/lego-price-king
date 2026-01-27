# 修复「Database `lego_price_king` does not exist」

报错说明：PostgreSQL 容器在跑，但库里**没有**名为 `lego_price_king` 的数据库，需要先建库、再建表。

---

## 在服务器上依次执行（共 3 步）

### 1. 创建数据库

```bash
docker exec -i lego_price_king_db psql -U postgres -c "CREATE DATABASE lego_price_king ENCODING 'UTF8';"
```

- 若输出 `CREATE DATABASE`，说明创建成功。
- 若提示 `already exists`，说明库已存在，可忽略，继续第 2 步。

---

### 2. 创建 lego_sets 表

任选其一即可。**方式 A 不需服务器上有 SQL 文件，也不易粘错，优先用。**

---

**方式 A：用 heredoc（推荐，不依赖 prisma 文件）**

整段复制到 SSH 终端，一次性粘贴、回车执行：

```bash
docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -f - <<'SQLEOF'
CREATE TABLE IF NOT EXISTS "lego_sets" (
  "setNumber"    TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "imageUrl"     TEXT NOT NULL,
  "theme"        TEXT NOT NULL,
  "subTheme"     TEXT,
  "year"         INTEGER NOT NULL,
  "minifigs"     INTEGER,
  "lastPrice"    DOUBLE PRECISION,
  "priceHistory" JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lego_sets_pkey" PRIMARY KEY ("setNumber")
);
SQLEOF
```

- 最后一行必须是单独的 `SQLEOF`，且前面不能有空格。
- 成功时无输出或只有 `CREATE TABLE`。

---

**方式 B：用 SQL 文件（需先 `git pull` 拉取 `prisma/init-lego_sets.sql`）**

```bash
cd /opt/lego-price-king
docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -f - < prisma/init-lego_sets.sql
```

---

**方式 C：单行 -c（复制后务必检查行尾，不要多出 `~`、空格或换行）**

```bash
docker exec -i lego_price_king_db psql -U postgres -d lego_price_king -c 'CREATE TABLE IF NOT EXISTS "lego_sets" ("setNumber" TEXT NOT NULL, "name" TEXT NOT NULL, "imageUrl" TEXT NOT NULL, "theme" TEXT NOT NULL, "subTheme" TEXT, "year" INTEGER NOT NULL, "minifigs" INTEGER, "lastPrice" DOUBLE PRECISION, "priceHistory" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "lego_sets_pkey" PRIMARY KEY ("setNumber"));'
```

---

### 3. 重启 app 容器

```bash
docker compose up -d
```

或：`docker-compose up -d`

---

## 验证

- 再打开套装详情页，点「更新价格」，不应再出现 `Database lego_price_king does not exist`。
- 若之前没有导入过数据，`lego_sets` 表为空，搜索/详情可能没有结果，需先按项目说明导入乐高数据。
