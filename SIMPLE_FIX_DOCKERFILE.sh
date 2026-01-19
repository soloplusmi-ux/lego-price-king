#!/bin/bash
# 在服务器上执行此脚本修复 Dockerfile

cd /opt/lego-price-king

# 备份
cp Dockerfile Dockerfile.bak

# 使用 sed 在 apk add 行前插入镜像源配置
sed -i '/^RUN apk add --no-cache libc6-compat$/i\
# 配置 Alpine 镜像源（使用阿里云镜像，解决网络问题）\
RUN sed -i '"'"'s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g'"'"' /etc/apk/repositories \&\& \\' Dockerfile

# 修改 apk add 行，添加缩进
sed -i 's/^RUN apk add --no-cache libc6-compat$/    apk add --no-cache libc6-compat/' Dockerfile

# 验证
echo "=== 修复后的内容 ==="
grep -B 1 -A 2 "apk add" Dockerfile

echo ""
echo "✅ Dockerfile 已修复！"
