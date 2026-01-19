# 完全修复 Dockerfile（清理重复和语法错误）

## 🔍 问题

Dockerfile 现在有：
1. 重复的 `RUN sed` 命令
2. `apk add` 行格式错误
3. 语法错误导致构建失败

---

## ✅ 完全修复（在服务器上执行）

### 方法 1: 使用 sed 完全重写这部分（推荐）

```bash
cd /opt/lego-price-king

# 备份
cp Dockerfile Dockerfile.bak

# 删除第 6-10 行的所有内容（包括重复的）
sed -i '6,10d' Dockerfile

# 在第 5 行后插入正确的内容
sed -i '5a\
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）\
RUN sed -i '"'"'s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g'"'"' /etc/apk/repositories \&\& \\\
    apk add --no-cache libc6-compat' Dockerfile

# 验证
grep -A 5 "FROM base AS deps" Dockerfile
```

---

### 方法 2: 手动编辑（最可靠）

```bash
cd /opt/lego-price-king

# 编辑文件
nano Dockerfile
```

**找到第 5-11 行左右，应该看到类似：**
```dockerfile
FROM base AS deps
# 配置 Alpine 镜像源(使用阿里云镜像,解决网络问题)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
# 配置 Alpine 镜像源(使用阿里云镜像,解决网络问题)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
apk add --no-cache libc6-compat
WORKDIR /app
```

**删除所有重复的行，只保留：**
```dockerfile
FROM base AS deps
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
WORKDIR /app
```

**关键点：**
- 只有**一个**注释行
- 只有**一个** `RUN sed` 命令
- `apk add` 前面有 **4 个空格**（缩进）
- `RUN sed` 行末尾有 `&& \`（续行符）

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

---

### 方法 3: 使用 Python 脚本（如果服务器有 Python）

```bash
cd /opt/lego-price-king

python3 <<'PYTHON'
import re

with open('Dockerfile', 'r') as f:
    lines = f.readlines()

# 找到 deps 部分并修复
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # 找到 "FROM base AS deps"
    if 'FROM base AS deps' in line:
        new_lines.append(line)
        i += 1
        
        # 跳过所有重复和错误的行，直到找到 WORKDIR
        while i < len(lines) and 'WORKDIR' not in lines[i]:
            if 'apk add' in lines[i] and 'RUN' not in lines[i]:
                # 这是错误的 apk add 行，跳过
                i += 1
                continue
            if 'RUN sed' in lines[i] or '配置 Alpine' in lines[i]:
                # 跳过重复的配置行
                i += 1
                continue
            i += 1
        
        # 插入正确的配置
        new_lines.append('# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）\n')
        new_lines.append("RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \\\n")
        new_lines.append('    apk add --no-cache libc6-compat\n')
        continue
    
    new_lines.append(line)
    i += 1

with open('Dockerfile', 'w') as f:
    f.writelines(new_lines)

print("✅ Dockerfile 已修复！")
PYTHON

# 验证
grep -A 5 "FROM base AS deps" Dockerfile
```

---

## 📋 验证修复

修复后执行：

```bash
# 查看 deps 部分
grep -A 5 "FROM base AS deps" Dockerfile
```

**应该看到：**
```dockerfile
FROM base AS deps
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
WORKDIR /app
```

**确认：**
- ✅ 只有**一个**注释行
- ✅ 只有**一个** `RUN sed` 命令
- ✅ `apk add` 前面有 **4 个空格**

---

## 🔨 修复后重新构建

```bash
docker compose build --no-cache
docker compose up -d
docker compose logs -f app
```

---

**推荐使用方法 2（手动编辑），最可靠！**
