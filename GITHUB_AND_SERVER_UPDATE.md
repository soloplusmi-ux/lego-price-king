# 上传到 GitHub 并更新服务器

本文档说明：如何把本地代码推送到 GitHub，以及在服务器上拉取并更新应用。

---

## 一、当前还需要什么？

**乐高比价王** 已使用的淘宝客接口：

- **taobao.tbk.dg.material.optional**（推广者-物料搜索）：按关键词搜商品，拿商品 ID 和推广链接。
- **taobao.tbk.item.info.get**（公用-商品详情简版）：按商品 ID 取价格、店铺名等。

这两项已满足「更新价格 + 购买渠道」需求，**不需要再增加接口**。

若以后想做这些功能，再考虑对应 API（非必须）：

- 淘口令：`taobao.tbk.tpwd.create`、`taobao.tbk.tpwd.convert`
- 优惠券详情：`taobao.tbk.coupon.get`、`taobao.tbk.itemid.coupon.get`
- 商品链接转推广链接：`taobao.tbk.item.convert`

---

## 二、上传到 GitHub（在你这台电脑上）

### 1. 打开终端

在项目目录 `lego-price-king` 下打开 PowerShell 或 CMD。

### 2. 查看有哪些改动（可选）

```powershell
cd C:\Users\Administrator\lego-price-king
git status
```

会看到未提交的文件，例如：`route.ts`、`docker-compose.yml`、`DATABASE_PERSISTENCE.md` 等。

### 3. 添加要提交的文件

**方式 A：只提交本次改动的核心文件（推荐）**

```powershell
git add app/api/refresh-prices/route.ts
git add docker-compose.yml
git add Dockerfile
git add DATABASE_PERSISTENCE.md
```

**方式 B：提交所有修改（含上面 + 其他已改文件）**

```powershell
git add .
```

### 4. 提交（写一条说明）

```powershell
git commit -m "淘宝客接口按文档对齐、数据库持久化与请求超时"
```

说明可按你实际改动改，例如：`"修复数据库丢失、淘宝客接口与文档一致"`。

### 5. 推送到 GitHub

```powershell
git push origin main
```

- 若提示要登录：按提示在浏览器或命令行完成 GitHub 登录/授权。
- 若 `Failed to connect to github.com`：检查网络/代理，或换能访问 GitHub 的环境再执行一次 `git push`。

推送成功后，GitHub 上的 `lego-price-king` 仓库会更新为当前代码。

---

## 三、在服务器上更新

在**服务器**上（SSH 登录后）执行。

### 1. 进入项目目录

```bash
cd /opt/lego-price-king
```

（若你的项目不在 `/opt/lego-price-king`，改成你的实际路径。）

### 2. 拉取最新代码

```bash
git pull origin main
```

### 3. 重新构建并启动（推荐）

```bash
docker compose up -d --build
```

- `--build`：会用当前代码重新构建镜像，保证跑的是刚拉下来的版本。
- 数据库在固定卷 `lego_price_king_postgres_data` 里，**不会**被清空；只有在你执行 `docker compose down -v` 时才会删数据。

### 4. 看日志（可选）

```bash
docker compose logs app --tail 50
```

确认没有报错、应用正常启动。

---

## 四、以后每次更新的流程

**本机（能访问 GitHub 的电脑）：**

```powershell
cd C:\Users\Administrator\lego-price-king
git add .
git commit -m "这里写你这次改了什么"
git push origin main
```

**服务器：**

```bash
cd /opt/lego-price-king
git pull origin main
docker compose up -d --build
```

---

## 五、常见问题

| 问题 | 处理 |
|------|------|
| `git push` 连不上 GitHub | 检查网络/代理；或在本机用 GitHub Desktop / 网页上传代码。 |
| 服务器 `git pull` 冲突 | 若未在服务器改代码，可执行 `git fetch origin` 再 `git reset --hard origin/main`（会丢弃服务器本地修改）。 |
| 更新后页面还是旧的 | 确认执行了 `docker compose up -d --build`；必要时 `docker compose build --no-cache app` 再 `docker compose up -d`。 |
| 不想删数据库 | 不要执行 `docker compose down -v`；只用 `git pull` + `docker compose up -d --build` 即可。 |

---

**总结**：本机用 `git add` → `git commit` → `git push origin main` 上传到 GitHub；服务器用 `git pull origin main` + `docker compose up -d --build` 更新。当前两个淘宝客接口已够用，无需再加接口。
