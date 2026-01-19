# Git 推送指南

## ✅ 当前状态

您的本地代码有 **1 个提交**还没有推送到 GitHub：
- `ccbc659 Add server update guide and quick fix script for Aliyun environment`

这个提交包含了修复 Google Fonts 的重要代码！

---

## 🚀 立即推送代码

### 在本地 Windows PowerShell 中执行：

```powershell
# 进入项目目录
cd C:\Users\Administrator\lego-price-king

# 推送到 GitHub
git push origin main
```

如果提示需要身份验证：
- **用户名**：输入您的 GitHub 用户名
- **密码**：输入 **Personal Access Token**（不是 GitHub 密码）

---

## 📋 完整操作流程

### 步骤 1: 在本地推送代码

```powershell
cd C:\Users\Administrator\lego-price-king
git push origin main
```

### 步骤 2: 在服务器上拉取代码

```bash
# SSH 连接到服务器
ssh root@8.138.110.247

# 进入项目目录
cd /opt/lego-price-king

# 拉取最新代码
git pull origin main
```

### 步骤 3: 重新构建 Docker

```bash
# 停止服务
docker compose down

# 清理缓存
docker system prune -f

# 重新构建
docker compose build --no-cache

# 启动服务
docker compose up -d
```

---

## 🔐 如果推送需要身份验证

### 方式 1: Personal Access Token（推荐）

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择权限：至少勾选 `repo`
4. 生成 token 并复制
5. 推送时，密码处输入这个 token

### 方式 2: 使用 SSH 密钥

如果已配置 SSH 密钥，可以改用 SSH 地址：

```powershell
# 查看当前远程地址
git remote -v

# 如果使用 HTTPS，可以改为 SSH（如果已配置密钥）
git remote set-url origin git@github.com:soloplusmi-ux/lego-price-king.git

# 然后推送
git push origin main
```

---

## ✅ 验证推送成功

推送成功后，访问您的 GitHub 仓库：
```
https://github.com/soloplusmi-ux/lego-price-king
```

应该能看到最新的提交记录。

---

## 🎯 推送后的操作

推送完成后，立即在服务器上执行：

```bash
cd /opt/lego-price-king
git pull origin main
docker compose down
docker compose build --no-cache
docker compose up -d
```

这样服务器就能获取到修复后的代码了！
