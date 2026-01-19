# GitHub 设置检查指南

## 🔍 完整诊断步骤

按照以下步骤逐一检查，找出问题所在。

---

## 步骤 1: 检查 Git 基本配置

```powershell
# 检查用户名和邮箱（必须设置）
git config --global user.name
git config --global user.email

# 如果没有输出，需要设置：
git config --global user.name "您的GitHub用户名"
git config --global user.email "您的GitHub邮箱"
```

---

## 步骤 2: 检查远程仓库地址

```powershell
cd C:\Users\Administrator\lego-price-king

# 查看远程仓库地址
git remote -v

# 应该显示类似：
# origin  https://github.com/soloplusmi-ux/lego-price-king.git (fetch)
# origin  https://github.com/soloplusmi-ux/lego-price-king.git (push)
```

**如果地址不对，修正它：**
```powershell
git remote set-url origin https://github.com/soloplusmi-ux/lego-price-king.git
```

---

## 步骤 3: 测试网络连接

### 3.1 测试 DNS 解析

```powershell
# 测试能否解析 GitHub 域名
nslookup github.com

# 或者使用 ping（Windows）
ping github.com -n 4
```

**结果判断：**
- ✅ 如果能解析并 ping 通 → **网络正常，可能是认证问题**
- ❌ 如果无法解析或超时 → **网络问题（DNS 或防火墙）**

### 3.2 测试 HTTPS 连接

```powershell
# 测试能否连接到 GitHub
Test-NetConnection github.com -Port 443

# 或者使用 curl（如果有）
curl -I https://github.com
```

---

## 步骤 4: 检查认证方式

### 4.1 检查是否使用 Personal Access Token

GitHub 从 2021 年起不再支持密码认证，必须使用 Personal Access Token (PAT)。

```powershell
# 查看 Git 凭据存储
git config --global credential.helper

# Windows 通常使用：
# manager-core 或 wincred
```

### 4.2 检查已保存的凭据

**Windows 凭据管理器：**
1. 按 `Win + R`，输入 `control`，回车
2. 打开"用户账户" → "凭据管理器"
3. 查看"Windows 凭据"标签
4. 查找 `git:https://github.com` 相关的条目

**如果看到旧的密码凭据，删除它！**

---

## 步骤 5: 创建新的 Personal Access Token

如果还没有 PAT，需要创建一个：

### 5.1 在 GitHub 上创建 Token

1. 登录 GitHub
2. 点击右上角头像 → **Settings**
3. 左侧菜单最下方 → **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. 点击 **Generate new token** → **Generate new token (classic)**
6. 填写：
   - **Note**: `lego-price-king-local`（描述）
   - **Expiration**: 选择过期时间（建议 90 天或 No expiration）
   - **Select scopes**: 勾选 `repo`（完整仓库权限）
7. 点击 **Generate token**
8. **⚠️ 重要：立即复制 token！** 只显示一次！

### 5.2 使用 Token 推送

```powershell
cd C:\Users\Administrator\lego-price-king

# 尝试推送，会提示输入用户名和密码
git push origin main

# 用户名：您的GitHub用户名
# 密码：粘贴刚才复制的 Personal Access Token（不是GitHub密码！）
```

---

## 步骤 6: 清除旧的凭据并重新认证

如果之前保存了错误的凭据：

```powershell
# 方法 1: 使用 Git Credential Manager 清除
git credential-manager-core erase
# 然后输入：
# protocol=https
# host=github.com
# （按两次回车）

# 方法 2: 手动删除 Windows 凭据
# 在"凭据管理器"中删除所有 github.com 相关的凭据

# 方法 3: 使用命令行清除（Windows）
cmdkey /list
# 找到 github.com 相关的，然后：
cmdkey /delete:git:https://github.com
```

---

## 步骤 7: 测试连接（不推送）

```powershell
# 测试能否连接到远程仓库（只读操作）
git ls-remote origin

# 如果成功，会显示远程分支列表
# 如果失败，会显示错误信息
```

**结果判断：**
- ✅ 成功 → **设置正确，可以推送**
- ❌ 失败 → **继续看下面的错误分析**

---

## 步骤 8: 错误信息分析

### 错误 1: `Could not resolve host: github.com`
**原因：** DNS 解析失败，网络问题
**解决：**
- 检查网络连接
- 尝试更换 DNS（如 8.8.8.8 或 114.114.114.114）
- 检查防火墙/代理设置

### 错误 2: `fatal: Authentication failed`
**原因：** 认证失败，设置问题
**解决：**
- 使用 Personal Access Token 而不是密码
- 清除旧凭据
- 重新输入正确的 token

### 错误 3: `fatal: remote origin already exists`
**原因：** 远程仓库已存在但地址可能不对
**解决：**
```powershell
git remote remove origin
git remote add origin https://github.com/soloplusmi-ux/lego-price-king.git
```

### 错误 4: `Permission denied (publickey)`
**原因：** 尝试使用 SSH 但未配置密钥
**解决：**
- 如果使用 HTTPS，确保使用 PAT
- 如果使用 SSH，需要配置 SSH 密钥

---

## 步骤 9: 完整测试流程

```powershell
# 1. 检查配置
git config --global user.name
git config --global user.email
git remote -v

# 2. 测试网络
ping github.com -n 4

# 3. 测试连接（只读）
git ls-remote origin

# 4. 如果上面都成功，尝试推送
git push origin main
```

---

## 🎯 快速诊断命令（一键执行）

复制以下命令到 PowerShell，一次性检查所有设置：

```powershell
Write-Host "=== Git 配置检查 ===" -ForegroundColor Cyan
git config --global user.name
git config --global user.email
Write-Host "`n=== 远程仓库检查 ===" -ForegroundColor Cyan
git remote -v
Write-Host "`n=== 网络连接测试 ===" -ForegroundColor Cyan
Test-NetConnection github.com -Port 443 -InformationLevel Quiet
if ($?) { Write-Host "✅ GitHub 连接正常" -ForegroundColor Green } 
else { Write-Host "❌ GitHub 连接失败" -ForegroundColor Red }
Write-Host "`n=== 远程仓库连接测试 ===" -ForegroundColor Cyan
git ls-remote origin 2>&1 | Select-Object -First 1
```

---

## 📋 检查清单

完成以下检查后，告诉我结果：

- [ ] Git 用户名和邮箱已设置
- [ ] 远程仓库地址正确
- [ ] 能 ping 通 github.com
- [ ] 能连接到 GitHub (端口 443)
- [ ] 已创建 Personal Access Token
- [ ] 已清除旧的凭据
- [ ] `git ls-remote origin` 能成功执行
- [ ] `git push origin main` 能成功执行

---

## 💡 推荐方案

**如果网络测试失败：**
- 使用代理/VPN
- 或等待网络恢复
- 或直接在服务器上手动修复（最快）

**如果网络测试成功但推送失败：**
- 使用 Personal Access Token
- 清除旧凭据
- 重新认证

告诉我您执行这些检查的结果，我会帮您进一步诊断！
