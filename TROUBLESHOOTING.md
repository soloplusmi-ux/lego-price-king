# 故障排查指南

## ❌ 问题：找不到 `.env.example` 和项目目录

### 错误信息
```
cp: cannot stat '.env.example': No such file or directory
cd: /root/lego-price-king: No such file or directory
```

### 原因
**项目代码还没有从 GitHub 克隆到服务器！**

### 解决方案

#### 步骤 1: 检查项目是否存在

在服务器上执行：

```bash
# 检查 /opt 目录下是否有项目
ls -la /opt/lego-price-king

# 或者检查 /root 目录
ls -la /root/lego-price-king

# 检查当前目录
pwd
ls -la
```

#### 步骤 2: 克隆代码（如果项目不存在）

```bash
# 安装 Git（如果未安装）
apt install git -y

# 创建项目目录
mkdir -p /opt
cd /opt

# 克隆代码（⚠️ 替换 YOUR_USERNAME 为您的 GitHub 用户名）
git clone https://github.com/YOUR_USERNAME/lego-price-king.git

# 进入项目目录
cd lego-price-king

# 查看文件列表（确认文件存在）
ls -la
```

您应该能看到：
- `.env.example`
- `docker-compose.yml`
- `package.json`
- 等其他文件

#### 步骤 3: 配置环境变量（在正确的目录下）

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 确认当前位置
pwd
# 应该显示: /opt/lego-price-king

# 现在再执行复制命令
cp .env.example .env

# 编辑配置文件
nano .env
```

#### 步骤 4: 启动项目（在项目目录下）

```bash
# 确保在项目目录
cd /opt/lego-price-king

# 确认 docker-compose.yml 存在
ls -la docker-compose.yml

# 启动服务
docker compose up -d
```

---

## 🔍 常见错误和解决方法

### 错误 1: `cp: cannot stat '.env.example': No such file or directory`

**原因**: 不在项目目录中，或项目未克隆

**解决**:
```bash
# 1. 确认当前位置
pwd

# 2. 进入项目目录
cd /opt/lego-price-king

# 3. 确认文件存在
ls -la .env.example

# 4. 如果文件不存在，说明项目未克隆，先执行步骤 2
```

### 错误 2: `cd: /root/lego-price-king: No such file or directory`

**原因**: 项目不在 `/root/` 目录下

**解决**:
```bash
# 根据部署指南，项目应该在 /opt/lego-price-king
cd /opt/lego-price-king

# 如果这里也没有，需要先克隆代码
```

### 错误 3: `no configuration file provided: not found`

**原因**: 不在项目根目录，找不到 `docker-compose.yml`

**解决**:
```bash
# 1. 进入项目目录
cd /opt/lego-price-king

# 2. 确认配置文件存在
ls -la docker-compose.yml

# 3. 然后执行启动命令
docker compose up -d
```

### 错误 4: `.env` 文件在错误的位置

如果您之前在 `/root/` 目录下创建了 `.env` 文件，需要移动或重新创建：

```bash
# 方法 1: 移动文件（如果之前在 /root/.env）
mv /root/.env /opt/lego-price-king/.env

# 方法 2: 重新创建（推荐）
cd /opt/lego-price-king
cp .env.example .env
nano .env
```

---

## 📋 完整操作流程（从头开始）

如果您还没有克隆代码，按以下步骤执行：

```bash
# 1. 安装 Git
apt install git -y

# 2. 创建并进入项目目录
mkdir -p /opt
cd /opt

# 3. 克隆代码（替换 YOUR_USERNAME）
git clone https://github.com/YOUR_USERNAME/lego-price-king.git

# 4. 进入项目目录
cd lego-price-king

# 5. 确认文件存在
ls -la
# 应该能看到 .env.example, docker-compose.yml 等文件

# 6. 复制并编辑配置文件
cp .env.example .env
nano .env

# 7. 启动服务
docker compose up -d
```

---

## ✅ 验证步骤

执行以下命令确认一切正常：

```bash
# 1. 确认在项目目录
pwd
# 应该显示: /opt/lego-price-king

# 2. 确认关键文件存在
ls -la .env.example .env docker-compose.yml

# 3. 确认 Docker 运行正常
docker --version
docker compose version

# 4. 启动服务并查看状态
docker compose up -d
docker compose ps
```

---

## 💡 提示

**记住：所有命令都要在项目目录 `/opt/lego-price-king` 下执行！**

如果忘记了当前位置，使用 `pwd` 查看，使用 `cd /opt/lego-price-king` 切换到项目目录。
