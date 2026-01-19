# 修复 "Empty reply from server" 错误

## 🔍 问题分析

您的网络连接正常，但 Git 协议通信失败。这通常是认证或代理问题。

---

## ✅ 解决方案

### 方案 1: 清除旧的 Git 凭据（推荐先试）

```powershell
# 1. 查看已保存的凭据
cmdkey /list | Select-String "github"

# 2. 删除所有 GitHub 相关的凭据
cmdkey /delete:git:https://github.com

# 3. 如果还有，也删除这个
cmdkey /delete:LegacyGeneric:target=git:https://github.com

# 4. 测试连接（会提示输入用户名和密码）
git ls-remote origin
```

**如果提示输入凭据：**
- 用户名：`soloplusmi-ux`
- 密码：使用 **Personal Access Token**（不是 GitHub 密码！）

---

### 方案 2: 检查并配置代理

如果您使用代理/VPN：

```powershell
# 1. 检查当前代理设置
git config --global --get http.proxy
git config --global --get https.proxy

# 2. 如果有代理，设置 Git 代理
# 假设代理地址是 http://127.0.0.1:7890（请根据实际情况修改）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 3. 测试连接
git ls-remote origin

# 4. 如果不需要代理，取消设置
# git config --global --unset http.proxy
# git config --global --unset https.proxy
```

---

### 方案 3: 使用 SSH 代替 HTTPS

SSH 通常比 HTTPS 更稳定：

```powershell
# 1. 检查是否已有 SSH 密钥
ls ~/.ssh/id_*

# 2. 如果没有，生成 SSH 密钥
ssh-keygen -t ed25519 -C "soloplusmi@gmail.com"
# 按回车使用默认路径，可以设置密码或直接回车

# 3. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 4. 复制公钥内容，然后：
# - 登录 GitHub
# - Settings → SSH and GPG keys → New SSH key
# - 粘贴公钥并保存

# 5. 更改远程仓库地址为 SSH
git remote set-url origin git@github.com:soloplusmi-ux/lego-price-king.git

# 6. 测试连接
git ls-remote origin
```

---

### 方案 4: 增加 Git 超时时间

```powershell
# 增加超时时间（秒）
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

# 测试连接
git ls-remote origin
```

---

### 方案 5: 使用 Gitee 镜像（临时方案）

如果 GitHub 持续无法访问，可以：

1. 在 Gitee 创建仓库
2. 添加 Gitee 为第二个远程仓库
3. 推送到 Gitee
4. 服务器从 Gitee 拉取

```powershell
# 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/您的用户名/lego-price-king.git

# 推送到 Gitee
git push gitee main
```

---

## 🚀 推荐操作顺序

1. **先试方案 1**（清除凭据）
2. **如果有代理，试方案 2**
3. **如果还不行，试方案 3**（SSH）
4. **或者直接在服务器上手动修复**（最快！）

---

## 💡 最快方案：直接在服务器上修复

既然本地代码已经修复完成，直接在服务器上手动创建文件即可，不需要等待 GitHub 推送！
