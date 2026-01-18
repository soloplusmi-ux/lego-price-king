# 完整问题修复指南

## 🎯 两个问题需要解决

### 问题 1: 本地 Windows - 没有安装 Node.js
### 问题 2: 服务器 - Docker 构建失败

---

## 📍 第一部分：修复本地 Windows（PowerShell）

### 步骤 1: 安装 Node.js

1. **下载 Node.js**
   - 访问：https://nodejs.org/
   - 下载 **LTS 版本**（推荐 v18 或 v20）
   - 选择 Windows Installer (.msi) - 64-bit

2. **安装 Node.js**
   - 双击下载的 `.msi` 文件
   - 按照向导安装
   - **重要**：确保勾选 "Add to PATH"

3. **验证安装**
   - **关闭当前 PowerShell，重新打开**
   - 执行：
   ```powershell
   node --version
   npm --version
   ```
   - 如果显示版本号，说明安装成功

### 步骤 2: 安装脚本依赖

```powershell
# 进入项目目录
cd C:\Users\Administrator\lego-price-king

# 进入 scripts 目录
cd scripts

# 安装依赖
npm install

# 返回项目根目录
cd ..
```

### 步骤 3: 配置环境变量

确保项目根目录的 `.env` 文件包含：

```env
# 远程数据库连接（用于同步脚本）
REMOTE_DATABASE_URL="postgresql://postgres:您的密码@8.138.110.247:5432/lego_price_king?schema=public"

# 阿里云 OSS 配置（如果要用图片上传功能）
ALIYUN_OSS_REGION="oss-cn-hangzhou"
ALIYUN_OSS_ACCESS_KEY_ID="您的OSS_KEY"
ALIYUN_OSS_ACCESS_KEY_SECRET="您的OSS_SECRET"
ALIYUN_OSS_BUCKET="您的bucket名称"
ALIYUN_OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
```

### 步骤 4: 上传数据

```powershell
# 确保在项目根目录
cd C:\Users\Administrator\lego-price-king

# 上传 2019 年数据
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

---

## 📍 第二部分：修复服务器（SSH）

### 步骤 1: 更新代码到服务器

在服务器上执行：

```bash
# 进入项目目录
cd /opt/lego-price-king

# 拉取最新代码（包含修复后的 Dockerfile）
git pull

# 如果还没有配置 git，需要先配置：
# git remote add origin https://github.com/YOUR_USERNAME/lego-price-king.git
# git pull origin main
```

**如果还没有推送到 GitHub**，可以手动更新 Dockerfile：

```bash
# 在服务器上编辑 Dockerfile
cd /opt/lego-price-king
nano Dockerfile
```

找到第 11 行，修改为：

```dockerfile
# 复制 package 文件
COPY package.json package-lock.json* ./
# 如果有 package-lock.json 使用 npm ci，否则使用 npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

### 步骤 2: 重新构建 Docker

```bash
# 停止现有服务
docker compose down

# 清理旧的构建缓存
docker system prune -f

# 重新构建（不使用缓存）
docker compose build --no-cache

# 启动服务
docker compose up -d
```

### 步骤 3: 查看构建日志

```bash
# 查看构建过程
docker compose build

# 查看服务日志
docker compose logs -f app
```

### 步骤 4: 初始化数据库（如果还没初始化）

```bash
# 等待服务启动（约 30 秒）
sleep 30

# 生成 Prisma Client
docker compose exec app npx prisma generate

# 推送数据库结构
docker compose exec app npx prisma db push
```

---

## 🔍 验证修复

### 验证本地 Windows

```powershell
# 检查 Node.js
node --version
npm --version

# 测试脚本
cd C:\Users\Administrator\lego-price-king
node scripts/sync_custom_excel.js --help
```

### 验证服务器

```bash
# 检查 Docker 服务
docker compose ps

# 应该看到两个容器都在运行：
# - lego_price_king_app (Up)
# - lego_price_king_db (Up)

# 检查网站
curl http://localhost:3000
```

### 验证网站

在浏览器访问：
```
http://8.138.110.247:3000
```

应该能看到"乐高比价王"首页。

---

## 📋 完整操作顺序

### 第一步：在本地 Windows 安装 Node.js

1. 下载并安装 Node.js（从 nodejs.org）
2. 重新打开 PowerShell
3. 验证 `node --version` 和 `npm --version`

### 第二步：在本地 Windows 上传数据

```powershell
cd C:\Users\Administrator\lego-price-king\scripts
npm install
cd ..
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

### 第三步：在服务器上修复 Docker

```bash
# SSH 连接到服务器
ssh root@8.138.110.247

# 更新代码
cd /opt/lego-price-king
git pull

# 重新构建
docker compose down
docker compose build --no-cache
docker compose up -d

# 初始化数据库
docker compose exec app npx prisma generate
docker compose exec app npx prisma db push
```

---

## ⚠️ 重要提示

1. **本地 Windows** = 安装 Node.js + 运行数据上传脚本
2. **服务器 Linux** = 只管理 Docker 服务，不需要安装 Node.js
3. **两个环境完全独立**，不要混淆

---

## 🆘 如果还有问题

### 本地 Windows 问题

- 检查 Node.js 是否正确安装：`node --version`
- 检查是否重新打开了 PowerShell
- 检查 PATH 环境变量

### 服务器问题

- 查看 Docker 构建日志：`docker compose build`
- 查看服务日志：`docker compose logs app`
- 检查 Docker 镜像：`docker images`

告诉我具体的错误信息，我会继续帮您解决！
