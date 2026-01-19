# 使用代理连接 GitHub

## 如果您有代理/VPN

### 设置 Git 代理

```powershell
# 假设您的代理地址是 http://127.0.0.1:7890
# 请根据您的实际代理地址修改

# 设置 HTTP 代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 测试连接
git ls-remote origin

# 如果成功，尝试推送
git push origin main

# 使用完后，取消代理
# git config --global --unset http.proxy
# git config --global --unset https.proxy
```

---

## 方案 2: 直接在服务器上修复（推荐，最快！）

既然本地代码已经修复完成，直接在服务器上手动创建文件即可！
