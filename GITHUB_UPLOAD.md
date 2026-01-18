# GitHub 上传指南

## 本地 Git 仓库已准备就绪 ✅

您的项目已经：
- ✅ 初始化 Git 仓库
- ✅ 添加所有文件
- ✅ 创建初始提交（30 个文件，2650 行代码）

## 上传到 GitHub 的步骤

### 方法 1: 使用 GitHub 网站创建仓库（推荐）

#### 步骤 1: 在 GitHub 上创建新仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 **"+"** 按钮，选择 **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `lego-price-king` (或您喜欢的名字)
   - **Description**: `乐高比价王 - Lego Price Comparison Site`
   - **Visibility**: 选择 **Public** 或 **Private**
   - ⚠️ **不要**勾选 "Initialize this repository with a README"
   - 点击 **"Create repository"**

#### 步骤 2: 连接到远程仓库并推送

在项目目录下执行以下命令（将 `YOUR_USERNAME` 替换为您的 GitHub 用户名）：

```powershell
# 进入项目目录
cd C:\Users\Administrator\lego-price-king

# 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/lego-price-king.git

# 查看远程仓库
git remote -v

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

**如果使用 SSH 方式**（需要先配置 SSH 密钥）：

```powershell
git remote add origin git@github.com:YOUR_USERNAME/lego-price-king.git
git branch -M main
git push -u origin main
```

### 方法 2: 使用 GitHub CLI（如果已安装）

```powershell
# 在项目目录下执行
cd C:\Users\Administrator\lego-price-king

# 创建 GitHub 仓库并推送
gh repo create lego-price-king --public --source=. --remote=origin --push
```

## 常见问题

### 问题 1: 需要身份验证

如果推送时提示需要身份验证，您可以使用：

**方式 1: Personal Access Token（推荐）**

1. 登录 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 选择权限：至少勾选 `repo`
4. 生成 token 并复制
5. 推送时，密码处输入这个 token

**方式 2: GitHub Desktop**

下载并安装 [GitHub Desktop](https://desktop.github.com/)，使用图形界面推送。

**方式 3: SSH 密钥**

配置 SSH 密钥后使用 `git@github.com:...` 格式的远程地址。

### 问题 2: 分支名称不匹配

如果 GitHub 默认使用 `main` 而本地使用 `master`：

```powershell
# 重命名分支
git branch -M main

# 推送到 main 分支
git push -u origin main
```

### 问题 3: 文件太大

如果某些文件过大（如图片），考虑：

1. 确保 `.gitignore` 已正确配置（本地数据文件不会被上传）
2. 使用 [Git LFS](https://git-lfs.github.com/) 处理大文件

## 验证上传

上传成功后，访问您的 GitHub 仓库页面，应该能看到：
- ✅ README.md
- ✅ 所有源代码文件
- ✅ 配置文件（docker-compose.yml, Dockerfile 等）
- ✅ 文档文件

## 后续更新

以后更新代码时：

```powershell
cd C:\Users\Administrator\lego-price-king

# 查看更改
git status

# 添加更改
git add .

# 提交更改
git commit -m "描述您的更改"

# 推送到 GitHub
git push
```

## 安全提醒

⚠️ **重要**: 确保以下文件不会被上传到 GitHub：

- `.env` - 包含敏感信息（已在 .gitignore 中）
- `data/excel/` - 本地 Excel 文件（已在 .gitignore 中）
- `data/images/` - 本地图片文件（已在 .gitignore 中）
- `node_modules/` - 依赖包（已在 .gitignore 中）

所有敏感文件都已配置在 `.gitignore` 中，不会被上传。

## 快速命令参考

```powershell
# 查看仓库状态
git status

# 查看提交历史
git log --oneline

# 查看远程仓库
git remote -v

# 拉取最新代码
git pull

# 推送代码
git push
```

## 需要帮助？

如果遇到问题，可以：
1. 查看 [GitHub 官方文档](https://docs.github.com/)
2. 查看 Git 错误信息并根据提示解决
3. 使用 GitHub Desktop 图形界面工具
