# 手动修复 Dockerfile（服务器上执行）

## 🔍 问题

服务器上的 Dockerfile 可能没有正确更新，需要手动修改。

---

## ✅ 在服务器上执行以下命令

### 方法 1: 使用 sed 命令自动修复（推荐）

```bash
cd /opt/lego-price-king

# 备份原文件
cp Dockerfile Dockerfile.bak

# 使用 sed 替换（单行命令）
sed -i '6s/.*/# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）/; 7s/.*/RUN sed -i '"'"'s\/dl-cdn.alpinelinux.org\/mirrors.aliyun.com\/g'"'"' \/etc\/apk\/repositories \&\& \\/; 8s/.*/    apk add --no-cache libc6-compat/' Dockerfile

# 验证修改
grep -A 2 "apk add" Dockerfile
```

**应该看到：**
```
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

---

### 方法 2: 手动编辑（如果 sed 失败）

```bash
cd /opt/lego-price-king

# 编辑文件
nano Dockerfile
```

找到第 6-8 行左右，应该看到：
```dockerfile
RUN apk add --no-cache libc6-compat
```

**替换为：**
```dockerfile
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

---

### 方法 3: 使用 cat 直接创建（最简单）

```bash
cd /opt/lego-price-king

# 备份
cp Dockerfile Dockerfile.bak

# 读取原文件并修改
cat > /tmp/dockerfile_fix.sh <<'SCRIPT'
#!/bin/bash
# 读取 Dockerfile，找到 apk add 行并替换
sed -i '/^RUN apk add --no-cache libc6-compat$/i\
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）\
RUN sed -i '"'"'s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g'"'"' /etc/apk/repositories \&\& \\' Dockerfile
sed -i 's/^RUN apk add --no-cache libc6-compat$/    apk add --no-cache libc6-compat/' Dockerfile
SCRIPT

chmod +x /tmp/dockerfile_fix.sh
/tmp/dockerfile_fix.sh

# 验证
grep -A 2 "apk add" Dockerfile
```

---

## 🚀 最简单的方法：直接替换整个部分

```bash
cd /opt/lego-price-king

# 备份
cp Dockerfile Dockerfile.bak

# 使用 Python 脚本修复（如果服务器有 Python）
python3 <<'PYTHON'
import re

with open('Dockerfile', 'r') as f:
    content = f.read()

# 替换 apk add 行
pattern = r'RUN apk add --no-cache libc6-compat'
replacement = '''# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \\
    apk add --no-cache libc6-compat'''

content = re.sub(pattern, replacement, content)

with open('Dockerfile', 'w') as f:
    f.write(content)

print("✅ Dockerfile 已修复")
PYTHON

# 验证
grep -A 2 "apk add" Dockerfile
```

---

## 📋 验证修复

修复后执行：

```bash
# 查看修改后的内容
grep -B 1 -A 2 "apk add" Dockerfile

# 应该看到：
# # 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
#     apk add --no-cache libc6-compat
```

---

## 🔨 修复后重新构建

```bash
docker compose build --no-cache
docker compose up -d
docker compose logs -f app
```

---

告诉我您想用哪种方法，或者直接告诉我执行结果！
