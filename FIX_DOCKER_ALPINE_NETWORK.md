# 修复 Docker Alpine 网络问题（Exit Code 3）

## 🔍 问题分析

Docker 构建时无法从 Alpine Linux 官方源下载包，错误：`exit code: 3`

错误信息：
```
WARNING: fetching https://dl-cdn.alpinelinux.org/alpine/v3.21/main: network connection aborted
ERROR: unable to select packages
```

**原因：** 服务器无法访问 Alpine 官方镜像源（在中国大陆很常见）

---

## ✅ 解决方案：配置 Alpine 镜像源

### 方法 1: 修改 Dockerfile（推荐）

在 Dockerfile 中，在 `apk add` 命令之前添加镜像源配置。

---

### 方法 2: 在服务器上配置 Docker 镜像源

在服务器上创建或修改 `/etc/docker/daemon.json`，添加 Alpine 镜像源。

---

## 🚀 立即修复步骤

### 步骤 1: 修改 Dockerfile

在服务器上执行：

```bash
cd /opt/lego-price-king

# 备份原文件
cp Dockerfile Dockerfile.bak

# 编辑 Dockerfile
nano Dockerfile
```

找到这一行：
```dockerfile
RUN apk add --no-cache libc6-compat
```

**替换为：**
```dockerfile
# 配置 Alpine 镜像源（使用阿里云镜像）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

或者使用清华大学镜像：
```dockerfile
# 配置 Alpine 镜像源（使用清华镜像）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

---

### 步骤 2: 重新构建

```bash
docker compose build --no-cache
docker compose up -d
```

---

## 📋 完整修复命令（一键执行）

```bash
cd /opt/lego-price-king

# 修改 Dockerfile
sed -i 's|RUN apk add --no-cache libc6-compat|RUN sed -i '"'"'s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g'"'"' /etc/apk/repositories \&\& \\\n    apk add --no-cache libc6-compat|' Dockerfile

# 验证修改
grep -A 1 "apk add" Dockerfile

# 重新构建
docker compose build --no-cache
docker compose up -d
```

---

## 🔧 如果 sed 命令太复杂，手动编辑

```bash
nano Dockerfile
```

找到包含 `apk add` 的行，修改为：

```dockerfile
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

保存后重新构建。

---

## 📝 可用的国内镜像源

- **阿里云**: `mirrors.aliyun.com`
- **清华大学**: `mirrors.tuna.tsinghua.edu.cn`
- **中科大**: `mirrors.ustc.edu.cn`
- **网易**: `mirrors.163.com`

---

告诉我执行结果！
