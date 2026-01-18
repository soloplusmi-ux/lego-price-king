#!/bin/bash

# 乐高比价王 - 一键部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  乐高比价王 - 服务器部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    echo "使用: sudo bash deploy.sh"
    exit 1
fi

# 步骤 1: 更新系统
echo -e "${YELLOW}[1/6] 更新系统包...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✓ 系统更新完成${NC}"
echo ""

# 步骤 2: 安装 Docker
echo -e "${YELLOW}[2/6] 安装 Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装${NC}"
    docker --version
else
    echo "正在安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
    docker --version
fi
echo ""

# 步骤 3: 安装 Docker Compose V2
echo -e "${YELLOW}[3/6] 安装 Docker Compose V2...${NC}"
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose 已安装${NC}"
    docker compose version
else
    echo "正在安装 Docker Compose..."
    apt install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose 安装完成${NC}"
    docker compose version
fi
echo ""

# 步骤 4: 安装 Git
echo -e "${YELLOW}[4/6] 安装 Git...${NC}"
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git 已安装${NC}"
    git --version
else
    apt install -y git
    echo -e "${GREEN}✓ Git 安装完成${NC}"
fi
echo ""

# 步骤 5: 克隆代码
echo -e "${YELLOW}[5/6] 克隆代码...${NC}"
PROJECT_DIR="/opt/lego-price-king"
GITHUB_REPO=""

# 提示用户输入 GitHub 仓库地址
if [ -z "$GITHUB_REPO" ]; then
    echo "请输入您的 GitHub 仓库地址:"
    echo "例如: https://github.com/YOUR_USERNAME/lego-price-king.git"
    read -p "> " GITHUB_REPO
fi

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}项目目录已存在，跳过克隆${NC}"
    cd $PROJECT_DIR
    git pull || echo "无法拉取更新，继续使用现有代码"
else
    mkdir -p /opt
    cd /opt
    git clone $GITHUB_REPO lego-price-king
    cd $PROJECT_DIR
    echo -e "${GREEN}✓ 代码克隆完成${NC}"
fi
echo ""

# 步骤 6: 配置环境变量
echo -e "${YELLOW}[6/6] 配置环境变量...${NC}"
cd $PROJECT_DIR

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 已创建 .env 文件${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  请编辑 .env 文件并填入您的配置:${NC}"
        echo "   nano $PROJECT_DIR/.env"
        echo ""
        echo "必需配置项:"
        echo "  - DATABASE_URL (数据库密码)"
        echo "  - ALIYUN_OSS_* (阿里云 OSS 配置)"
        echo "  - TAOBAO_* (淘宝联盟 API 配置)"
        echo "  - API_SECRET_KEY (API 密钥)"
        echo "  - NEXT_PUBLIC_APP_URL (应用 URL)"
        echo ""
        read -p "配置完成后按 Enter 继续..."
    else
        echo -e "${RED}✗ 未找到 .env.example 文件${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件已存在${NC}"
fi
echo ""

# 生成随机数据库密码（如果未设置）
if ! grep -q "postgres:.*@postgres" .env; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    sed -i "s/postgres:postgres@postgres/postgres:${DB_PASSWORD}@postgres/g" .env
    echo -e "${GREEN}✓ 已生成随机数据库密码${NC}"
fi

# 生成 API 密钥（如果未设置）
if ! grep -q "API_SECRET_KEY=.*[a-zA-Z0-9]" .env; then
    API_KEY=$(openssl rand -hex 32)
    sed -i "s/API_SECRET_KEY=.*/API_SECRET_KEY=${API_KEY}/g" .env
    echo -e "${GREEN}✓ 已生成随机 API 密钥${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}环境准备完成！${NC}"
echo "=========================================="
echo ""
echo "下一步操作:"
echo "1. 编辑 .env 文件: nano $PROJECT_DIR/.env"
echo "2. 启动服务: cd $PROJECT_DIR && docker compose up -d"
echo "3. 初始化数据库: docker compose exec app npx prisma db push"
echo "4. 访问网站: http://8.138.110.247:3000"
echo ""
