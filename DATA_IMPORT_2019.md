# data2019.xlsx 数据导入说明

用于将 `data2019.xlsx`（brickset 数据）导入到服务器数据库，并配合**服务器本地的 `public/images/` 图片**使用。

---

## 一、Excel 列映射

| Excel 列 | 数据库字段 | 说明 |
|----------|------------|------|
| 编号     | setNumber  | 主键，也用作图片文件名 |
| 名称     | name       | |
| 主题     | theme      | |
| 子主题   | subTheme   | 有则填，空则 null |
| 年份     | year       | 数字 |
| 人仔数   | minifigs   | 数字，空则 null |
| 图片链接 | **不使用** | 图片改用服务器本地文件，见下文 |

---

## 二、图片规则（服务器本地，不经过 OSS）

- 图片**不**使用 Excel 里的「图片链接」。
- 您把图片按「**编号**」命名（如 `10264-1.jpg`、`21318.png`），放到服务器的 **`public/images/`** 目录。
- 导入脚本会把 `imageUrl` 写成：`/images/{编号}.jpg`（默认 `.jpg`；若是 `.png` 可在命令里改）。

**示例：**

- 编号 `10264-1` → 服务器上的文件：`public/images/10264-1.jpg`
- 编号 `21318` → 服务器上的文件：`public/images/21318.jpg`

---

## 三、在您本机：导入 Excel 到服务器数据库

### 1. 环境

- 在**项目根目录**已执行过：`npm install`、`npx prisma generate`
- `.env` 里配置好 **`REMOTE_DATABASE_URL`**（或 `DATABASE_URL`），指向服务器上的 PostgreSQL，例如：
  ```env
  REMOTE_DATABASE_URL="postgresql://postgres:你的密码@服务器IP:5432/lego_price_king?schema=public"
  ```
- 服务器已开放 **5432** 端口给您当前电脑的 IP

### 2. 执行导入（在项目根目录）

```powershell
cd C:\Users\Administrator\lego-price-king

node scripts/sync_data2019.js "F:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

若图片扩展名是 **`.png`**：

```powershell
node scripts/sync_data2019.js "F:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx" .png
```

### 3. 脚本会做什么

- 读 Excel：`编号、名称、主题、子主题、年份、人仔数`
- 忽略「图片链接」列
- 为每条记录设置 `imageUrl = /images/{编号}.jpg`（或您指定的扩展名）
- 用 **Upsert** 写入远程库：存在则更新，不存在则插入

---

## 四、在服务器上：放图片

### 1. 目录位置

在服务器上，项目一般在：

```
/opt/lego-price-king/
```

图片目录为：

```
/opt/lego-price-king/public/images/
```

`docker-compose` 已把 `./public/images` 挂载到容器内的 `/app/public/images`，放进去的图片会通过 `/images/xxx.jpg` 被访问。

### 2. 文件名

- 必须与 Excel 的「**编号**」完全一致，例如：`10264-1.jpg`、`21318.png`。
- 扩展名要和导入时一致：默认按 `.jpg` 写 `imageUrl`；若用 `.png` 导入，则放 `编号.png`。

### 3. 上传方式示例

在您本机（Windows）操作，把本地图片夹上传到服务器 `public/images/`：

```powershell
# 使用 scp（在 PowerShell 或 CMD 中）
# 将本机 E:\lego-images\ 下的所有文件传到服务器
scp -r E:\lego-images\* root@你的服务器IP:/opt/lego-price-king/public/images/
```

或用 WinSCP、FileZilla 等把 `E:\lego-images\*` 上传到：

```
/opt/lego-price-king/public/images/
```

### 4. 放好图片后

- 若应用已在跑：`docker compose` 已挂载 `public/images`，**不用重启**，刷新页面即可。
- 若还未启动：先执行 `docker compose up -d`，再通过 `http://服务器IP:3000` 访问。

---

## 五、建议操作顺序

1. 在**本机**运行 `sync_data2019.js`，把 **data2019.xlsx** 导入到**服务器数据库**。
2. 在**本机**准备好按「编号」命名的图片（如从 brickset 等下载）。
3. 用 **scp / WinSCP / FileZilla** 把这些图片上传到服务器的  
   **`/opt/lego-price-king/public/images/`**。
4. 在服务器上确认 `docker compose up -d` 已运行；如需重启：
   ```bash
   cd /opt/lego-price-king
   docker compose restart app
   ```
5. 浏览器访问 `http://服务器IP:3000`，搜索或点进套装查看图片是否正常。

---

## 六、常见问题

**Q: 导入时报「REMOTE_DATABASE_URL 未配置」？**  
A: 在项目根目录的 `.env` 中配置 `REMOTE_DATABASE_URL` 或 `DATABASE_URL`，并确保能连到服务器的 5432。

**Q: 导入时报「connect ECONNREFUSED」？**  
A: 检查服务器防火墙是否开放 5432，以及 `REMOTE_DATABASE_URL` 里的 IP、端口、用户名、密码、库名是否正确。

**Q: 页面显示不出图片？**  
A: 确认：
- 文件在服务器的 `/opt/lego-price-king/public/images/` 下；
- 文件名与 Excel「编号」完全一致（含 `-`、大小写等）；
- 扩展名与导入时一致（默认 `.jpg`）。

**Q: 图片是 .png，导入时按 .jpg 写了怎么办？**  
A: 重新执行导入并指定扩展名：  
`node scripts/sync_data2019.js "Excel路径" .png`

**Q: 以后图片多了，能不能改成 OSS？**  
A: 可以。后续把 `imageUrl` 改为 OSS 的 URL，并让 `sync_data` / `sync_custom_excel` 负责上传到 OSS 即可；`sync_data2019.js` 也可再扩展为支持 OSS。

**Q: 路径里有中文（如「brickset 数据」），命令行报「文件不存在」？**  
A: 若 PowerShell 传参乱码，可改用环境变量：
  ```powershell
  $env:EXCEL_PATH_2019 = "F:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
  node scripts/sync_data2019.js
  ```
  或用 CMD、在资源管理器里把 `data2019.xlsx` 拖进 CMD 窗口再回车。

---

## 七、文件与配置一览

| 项目 | 路径/说明 |
|------|-----------|
| 导入脚本 | `scripts/sync_data2019.js` |
| Excel 示例路径 | `F:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx` |
| 服务器图片目录 | `/opt/lego-price-king/public/images/` |
| 访问路径 | `/images/{编号}.jpg` 或 `/images/{编号}.png` |
| docker-compose 挂载 | `./public/images` → 容器内 `/app/public/images` |
