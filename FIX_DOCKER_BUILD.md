# Docker 构建问题修复指南

## ❌ 问题 1: Docker 构建失败 - `npm ci` 错误

### 错误信息
```
failed to solve: process "/bin/sh -c npm ci" did not complete successfully: exit code: 1
```

### 原因
`npm ci` 需要 `package-lock.json` 文件，如果文件不存在或有问题会导致失败。

### ✅ 解决方案

我已经修复了 Dockerfile，现在它会：
- 如果有 `package-lock.json`，使用 `npm ci`（更快、更可靠）
- 如果没有，使用 `npm install`（自动生成 lock 文件）

### 重新构建

在服务器上执行：

```bash
# 进入项目目录
cd /opt/lego-price-king

# 停止现有服务
docker compose down

# 重新构建（不使用缓存）
docker compose build --no-cache

# 启动服务
docker compose up -d
```

---

## ❌ 问题 2: 在服务器上执行了 Windows 命令

### 错误信息
```
-bash: cd: C:UsersAdministratorlego-price-kingscripts: No such file or directory
Command 'node' not found
Command 'npm' not found
```

### 原因
**数据上传脚本应该在您的本地 Windows 机器上运行，不是在服务器上！**

### ✅ 正确的操作方式

#### 数据上传脚本 - 在本地 Windows 机器运行

1. **在您的 Windows 电脑上**（不是服务器）打开 PowerShell 或 CMD

2. **进入项目目录**（使用 Windows 路径）：
```powershell
cd C:\Users\Administrator\lego-price-king
```

3. **安装脚本依赖**（如果还没安装）：
```powershell
cd scripts
npm install
cd ..
```

4. **上传数据**：
```powershell
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

#### 服务器操作 - 只在服务器上执行

服务器上只需要：
- 运行 Docker 服务
- 查看日志
- 管理数据库

**不需要在服务器上安装 Node.js 或运行数据上传脚本！**

---

## 📋 完整操作流程

### 在服务器上（SSH 连接后）

```bash
# 1. 进入项目目录
cd /opt/lego-price-king

# 2. 重新构建 Docker 镜像
docker compose build --no-cache

# 3. 启动服务
docker compose up -d

# 4. 查看日志
docker compose logs -f app

# 5. 初始化数据库（如果还没初始化）
docker compose exec app npx prisma generate
docker compose exec app npx prisma db push
```

### 在本地 Windows 机器上

```powershell
# 1. 打开 PowerShell
# 2. 进入项目目录
cd C:\Users\Administrator\lego-price-king

# 3. 安装脚本依赖（首次运行）
cd scripts
npm install
cd ..

# 4. 配置 .env 文件（如果还没配置）
# 确保有 REMOTE_DATABASE_URL

# 5. 上传数据
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

---

## 🔍 验证修复

### 检查 Docker 构建

```bash
# 在服务器上
cd /opt/lego-price-king
docker compose build

# 应该能看到成功构建，没有 npm ci 错误
```

### 检查服务运行

```bash
# 查看服务状态
docker compose ps

# 应该看到两个容器都在运行
# - lego_price_king_app
# - lego_price_king_db
```

### 检查网站

访问：`http://8.138.110.247:3000`

应该能看到网站正常运行。

---

## ⚠️ 重要提醒

1. **数据上传脚本 = 本地 Windows 机器**
2. **Docker 服务 = 服务器（Linux）**
3. **不要混淆两者的操作环境！**

如果还有问题，告诉我具体的错误信息。
