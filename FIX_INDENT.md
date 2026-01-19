# 修复 Dockerfile 缩进问题

## 🔍 问题

`apk add` 行缺少缩进，需要添加 4 个空格。

---

## ✅ 在服务器上执行

```bash
cd /opt/lego-price-king

# 修复缩进（在 apk add 前面添加 4 个空格）
sed -i 's/^apk add --no-cache libc6-compat$/    apk add --no-cache libc6-compat/' Dockerfile

# 验证修复
grep -B 1 -A 2 "apk add" Dockerfile
```

**应该看到：**
```
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
```

注意 `apk add` 前面有 4 个空格！

---

## 🔧 如果 sed 命令失败，手动编辑

```bash
nano Dockerfile
```

找到这一行（没有缩进的）：
```
apk add --no-cache libc6-compat
```

在 `apk` 前面添加 4 个空格，变成：
```
    apk add --no-cache libc6-compat
```

保存：`Ctrl + O` → `Enter` → `Ctrl + X`

---

修复后就可以重新构建了！
