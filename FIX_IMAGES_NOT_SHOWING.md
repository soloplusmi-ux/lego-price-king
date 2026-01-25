# 修复「照片已上传但页面不显示」

照片已传到 `/opt/lego-price-king/public/images/`，但套装详情页/搜索列表里看不到图，按下面排查。

---

## 一、代码修改（已完成）

在 **`app/set/[setNumber]/page.tsx`** 和 **`app/search/page.tsx`** 里，对**本地** `/images/` 的图片加了 `unoptimized`，避免走 Next.js 图片优化导致加载失败：

- 详情页、搜索卡片：`unoptimized={set.imageUrl.startsWith('/images/')}`

修改后需重新部署：`git push`，服务器上 `git pull` 再 `docker compose up -d --build`。

---

## 二、在服务器上排查（SSH 后执行）

### 1. 确认图片在挂载目录里

```bash
ls -la /opt/lego-price-king/public/images/ | head -20
```

应能看到 `76114-1.jpg`、`10264-1.jpg` 等。若没有，说明本机 scp 的目录或服务器上的项目路径不对。

---

### 2. 确认容器内能看到这些文件

```bash
docker exec lego_price_king_app ls -la /app/public/images/ | head -20
```

若这里没有 `76114-1.jpg`，多半是 **docker-compose 的 `./public/images` 挂载路径**和实际放文件的目录不一致（例如项目不在 `/opt/lego-price-king`）。  
解决：把图片放到 `docker compose` 所在目录的 `./public/images/` 下，或把 `docker-compose.yml` 里的 `./public/images` 改成你实际放图的路径。

---

### 3. 直接访问图片 URL

在浏览器打开：

```
http://8.138.110.247:3000/images/76114-1.jpg
```

- **能打开**：说明静态文件服务正常，页面上不显示多半是之前 Next Image 优化导致的，代码已改为 `unoptimized`，部署后应恢复。
- **404**：说明应用没正确提供 `/images/`，继续看下面。

---

### 4. 确认数据库里的 imageUrl

```bash
docker exec -it lego_price_king_db psql -U postgres -d lego_price_king -c "SELECT \"setNumber\", \"imageUrl\" FROM lego_sets WHERE \"setNumber\" = '76114-1';"
```

应为 `/images/76114-1.jpg`。若是别的（例如 OSS 地址或空），需要按 `DATA_IMPORT_2019.md` 用 `sync_data2019.js` 重新导入，或改库里的 `imageUrl`。

---

### 5. 文件权限（若 3 为 404 再看）

```bash
# 宿主上
chmod 755 /opt/lego-price-king/public/images
chmod 644 /opt/lego-price-king/public/images/*.jpg
```

然后重启 app：`docker compose restart app`，再访问 `http://8.138.110.247:3000/images/76114-1.jpg`。

---

## 三、常见原因小结

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 直接 URL `/images/76114-1.jpg` 能打开，页面仍不显示 | Next Image 优化导致 | 已加 `unoptimized`，重新部署 |
| 直接 URL 404，`ls /app/public/images` 有文件 | Next 未正确提供 public | 检查 Dockerfile 是否 `COPY` 了 `public`，以及 standalone 配置 |
| 直接 URL 404，`ls /app/public/images` 无文件 | 挂载路径不对 | 确认 `./public/images` 与真实目录一致，或改 `docker-compose.yml` |
| 数据库 `imageUrl` 不是 `/images/76114-1.jpg` | 导入脚本或扩展名不一致 | 用 `sync_data2019.js` 重导，或统一为 `.jpg`/`.png` 后改库 |

---

## 四、部署代码修改

```bash
# 本机
cd C:\Users\Administrator\lego-price-king
git add app/set/ app/search/
git commit -m "fix: 本地 /images/ 使用 unoptimized 以正确显示图片"
git push

# 服务器
cd /opt/lego-price-king
git pull
docker compose up -d --build
```
