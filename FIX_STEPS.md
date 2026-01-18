# 🔧 立即修复步骤

## 问题原因

您跳过了 **步骤 3: 克隆代码**，所以项目文件不存在。

## ✅ 快速修复（复制执行）

在服务器终端中，**按顺序执行**以下命令：

### 步骤 1: 检查并安装 Git

```bash
# 检查 Git 是否安装
git --version

# 如果未安装，执行：
apt install git -y
```

### 步骤 2: 克隆代码到服务器

```bash
# 创建项目目录
mkdir -p /opt
cd /opt

# 克隆代码（⚠️ 将 YOUR_USERNAME 替换为您的 GitHub 用户名）
git clone https://github.com/YOUR_USERNAME/lego-price-king.git

# 进入项目目录
cd lego-price-king

# 查看文件（确认克隆成功）
ls -la
```

**您应该能看到这些文件**：
- `.env.example` ✅
- `docker-compose.yml` ✅
- `package.json` ✅
- 其他项目文件 ✅

### 步骤 3: 配置环境变量

```bash
# 确保在项目目录（应该在 /opt/lego-price-king）
pwd
# 如果显示 /opt/lego-price-king，继续下一步

# 复制 .env 文件
cp .env.example .env

# 编辑配置（填入您的真实配置）
nano .env
```

**在 nano 中填入配置后**：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

### 步骤 4: 启动项目

```bash
# 确认在项目目录
cd /opt/lego-price-king

# 确认 docker-compose.yml 存在
ls -la docker-compose.yml

# 启动服务
docker compose up -d

# 查看状态
docker compose ps
```

### 步骤 5: 初始化数据库

```bash
# 等待服务启动（约 20 秒）
sleep 20

# 初始化数据库
docker compose exec app npx prisma generate
docker compose exec app npx prisma db push
```

---

## 🎯 如果您已经创建了 .env 文件在错误位置

如果您之前在 `/root/.env` 创建了配置文件，有两种处理方式：

### 方式 1: 移动文件（推荐）

```bash
# 先克隆代码（如果还没克隆）
cd /opt
git clone https://github.com/YOUR_USERNAME/lego-price-king.git
cd lego-price-king

# 移动 .env 文件（如果存在）
mv /root/.env /opt/lego-price-king/.env

# 验证
ls -la .env
```

### 方式 2: 重新创建

```bash
# 进入项目目录
cd /opt/lego-price-king

# 重新创建 .env
cp .env.example .env
nano .env
# 重新填入配置
```

---

## 📋 完整命令清单（一键复制）

**如果您想从头开始，复制以下所有命令一起执行**：

```bash
# === 完整部署命令 ===

# 1. 安装 Git
apt install git -y

# 2. 克隆代码（替换 YOUR_USERNAME）
mkdir -p /opt
cd /opt
git clone https://github.com/YOUR_USERNAME/lego-price-king.git
cd lego-price-king

# 3. 配置环境变量
cp .env.example .env
echo "请手动编辑 .env 文件: nano .env"

# 4. 启动服务（编辑 .env 后执行）
# docker compose up -d
# sleep 20
# docker compose exec app npx prisma generate
# docker compose exec app npx prisma db push
```

**注意**：第 4 步的命令需要在编辑 `.env` 文件后执行。

---

## ⚠️ 重要提醒

1. **项目目录是 `/opt/lego-price-king`**，不是 `/root/lego-price-king`
2. **所有命令都要在项目目录下执行**
3. **执行前用 `pwd` 确认当前位置**
4. **`.env` 文件必须在项目目录 `/opt/lego-price-king/.env`**

---

## 🔍 验证命令

执行以下命令确认一切正确：

```bash
# 1. 确认在项目目录
pwd
# 应该显示: /opt/lego-price-king

# 2. 确认关键文件存在
ls -la .env.example .env docker-compose.yml
# 应该能看到这三个文件

# 3. 确认 Docker 正常运行
docker compose ps
```

如果以上都正确，就可以继续启动服务了！
