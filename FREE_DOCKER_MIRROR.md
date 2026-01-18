# 免费 Docker 镜像加速器配置（完全免费）

## ✅ 完全免费的方法

以下所有镜像源都是**完全免费**的，不需要任何付费！

## 🚀 快速配置（推荐方法）

### 方法 1: 使用图片中的镜像源（推荐）

在服务器上执行：

```bash
# 1. 编辑 Docker 配置文件
nano /etc/docker/daemon.json
```

**在 nano 编辑器中，粘贴以下内容**（如果文件是空的，直接全部粘贴）：

```json
{
  "registry-mirrors": [
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io",
    "https://reg-mirror.qiniu.com"
  ]
}
```

**保存并退出**：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

```bash
# 2. 重启 Docker 服务生效
systemctl daemon-reload
systemctl restart docker

# 3. 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

---

### 方法 2: 使用一键命令（更简单）

如果不想手动编辑文件，直接执行：

```bash
# 创建配置文件（自动覆盖）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io",
    "https://reg-mirror.qiniu.com"
  ]
}
EOF

# 重启 Docker
systemctl daemon-reload
systemctl restart docker

# 验证
docker info | grep -A 10 "Registry Mirrors"
```

---

### 方法 3: 使用更多免费镜像源（备选）

如果上面的镜像源速度不够快，可以尝试这些：

```bash
nano /etc/docker/daemon.json
```

粘贴以下内容（包含更多镜像源）：

```json
{
  "registry-mirrors": [
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io",
    "https://reg-mirror.qiniu.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

保存后重启 Docker：

```bash
systemctl daemon-reload
systemctl restart docker
```

---

## 🧪 测试配置

配置完成后，测试是否能正常拉取镜像：

```bash
# 测试拉取 postgres 镜像
docker pull postgres:15-alpine

# 如果成功，会显示下载进度
```

---

## 📋 完整操作步骤（复制执行）

```bash
# === 完整配置步骤 ===

# 1. 创建配置文件
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io",
    "https://reg-mirror.qiniu.com"
  ]
}
EOF

# 2. 重启 Docker
systemctl daemon-reload
systemctl restart docker

# 3. 验证配置
docker info | grep -A 10 "Registry Mirrors"

# 4. 测试拉取镜像
docker pull postgres:15-alpine

# 5. 进入项目目录并启动服务
cd /opt/lego-price-king
docker compose up -d
```

---

## 💡 重要说明

### ✅ 这些都是完全免费的
- 百度云镜像：`https://mirror.baidubce.com` - **免费**
- DaoCloud 镜像：`https://docker.m.daocloud.io` - **免费**
- 七牛云镜像：`https://reg-mirror.qiniu.com` - **免费**
- 中科大镜像：`https://docker.mirrors.ustc.edu.cn` - **免费**
- 网易镜像：`https://hub-mirror.c.163.com` - **免费**

### ❌ 不需要付费
- 不需要注册账号
- 不需要绑定信用卡
- 不需要购买服务
- 直接使用即可

### ⚠️ 关于阿里云镜像加速器
- 阿里云镜像加速器**也是免费的**，但需要阿里云账号
- 如果您没有阿里云账号，**完全不需要**使用它
- 使用上面列出的免费镜像源就足够了

---

## 🔍 如果配置后仍然很慢

如果配置后下载还是很慢，可以：

1. **尝试不同的镜像源**：编辑 `daemon.json`，只保留一个镜像源测试
2. **检查网络**：`ping mirror.baidubce.com`
3. **使用代理**：如果服务器有代理，可以配置 Docker 代理

---

## ✅ 验证成功

配置成功后，执行 `docker compose up -d` 应该能正常下载镜像并启动服务了！
