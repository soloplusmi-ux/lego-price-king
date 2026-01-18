# Docker 网络问题解决方案

## ❌ 错误信息

```
Error response from daemon: failed to resolve reference "docker.io/library/postgres:15-alpine": 
failed to do request: Head "https://registry-1.docker.io/v2/library/postgres/manifests/15-alpine": 
dial tcp 103.252.115.153:443: i/o timeout
```

## 🔍 问题原因

服务器无法访问 Docker Hub（在中国访问 Docker Hub 经常有网络问题）。

## ✅ 解决方案：配置 Docker 镜像加速器

### 方法 1: 使用阿里云镜像加速器（推荐）

#### 步骤 1: 获取加速器地址

1. 登录 [阿里云容器镜像服务](https://cr.console.aliyun.com/)
2. 点击左侧菜单"镜像加速器"
3. 复制您的专属加速器地址（类似：`https://xxxxx.mirror.aliyuncs.com`）

#### 步骤 2: 配置 Docker 镜像加速

在服务器上执行：

```bash
# 创建或编辑 Docker 配置文件
mkdir -p /etc/docker
nano /etc/docker/daemon.json
```

#### 步骤 3: 添加镜像加速配置

在 `daemon.json` 文件中添加以下内容（将 `YOUR_MIRROR_URL` 替换为您的阿里云加速器地址）：

```json
{
  "registry-mirrors": [
    "https://YOUR_MIRROR_URL",
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

**如果文件已存在**，只需添加 `registry-mirrors` 部分。

#### 步骤 4: 重启 Docker 服务

```bash
# 重新加载配置
systemctl daemon-reload

# 重启 Docker
systemctl restart docker

# 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

#### 步骤 5: 重新拉取镜像

```bash
# 进入项目目录
cd /opt/lego-price-king

# 重新启动服务
docker compose up -d
```

---

### 方法 2: 使用其他国内镜像源（如果阿里云不可用）

如果还没有阿里云账号，可以使用以下公共镜像源：

```bash
# 编辑配置文件
nano /etc/docker/daemon.json
```

添加以下内容：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

然后执行：

```bash
systemctl daemon-reload
systemctl restart docker
```

---

### 方法 3: 手动配置（如果 daemon.json 不存在）

```bash
# 创建配置文件目录
mkdir -p /etc/docker

# 创建配置文件
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
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

## 🧪 测试镜像拉取

配置完成后，测试是否能正常拉取镜像：

```bash
# 测试拉取 postgres 镜像
docker pull postgres:15-alpine

# 如果成功，会显示下载进度并完成
```

---

## 📋 完整操作步骤（一键复制）

```bash
# === 配置 Docker 镜像加速器 ===

# 1. 创建配置文件
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
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

## 🔧 其他网络问题排查

### 检查网络连接

```bash
# 测试 DNS 解析
ping registry-1.docker.io

# 测试 HTTPS 连接
curl -I https://registry-1.docker.io/v2/
```

### 检查防火墙

```bash
# 检查防火墙状态
ufw status

# 确保 Docker 可以访问外部网络
# Docker 默认使用 iptables，一般不需要额外配置
```

### 检查代理设置

如果服务器使用代理，需要配置 Docker 代理：

```bash
# 创建代理配置目录
mkdir -p /etc/systemd/system/docker.service.d

# 创建代理配置文件
cat > /etc/systemd/system/docker.service.d/http-proxy.conf <<EOF
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:8080"
Environment="HTTPS_PROXY=http://proxy.example.com:8080"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

# 重新加载并重启
systemctl daemon-reload
systemctl restart docker
```

---

## ⚠️ 关于 docker-compose.yml 的警告

如果看到这个警告：
```
WARN [0000] the attribute `version` is obsolete
```

这是正常的，不影响功能。如果想消除警告，可以：

```bash
cd /opt/lego-price-king
nano docker-compose.yml
```

删除第一行的 `version: '3.8'` 这一行即可。

---

## ✅ 验证部署

配置完成后，执行：

```bash
# 1. 测试镜像拉取
docker pull postgres:15-alpine

# 2. 启动服务
cd /opt/lego-price-king
docker compose up -d

# 3. 查看服务状态
docker compose ps

# 4. 查看日志
docker compose logs
```

如果一切正常，服务应该能成功启动！
