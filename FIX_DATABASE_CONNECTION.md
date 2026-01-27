# 修复数据库连接问题

## 问题症状

- 搜索页面显示 "Application error"
- 套装详情页无法打开
- 日志中出现 `PrismaClientInitializationError`
- 数据库认证失败：`Authentication failed against database server at 'postgres'`

## 快速修复步骤

### 1. 检查并启动所有服务

```bash
cd /opt/lego-price-king

# 查看服务状态
docker compose ps

# 如果 postgres 服务未运行，启动所有服务
docker compose up -d

# 等待几秒后，再次检查状态
docker compose ps
```

### 2. 检查数据库密码配置

确保 `.env` 文件中的 `POSTGRES_PASSWORD` 与 docker-compose.yml 中的一致：

```bash
# 查看当前 .env 中的密码（如果设置了）
grep POSTGRES_PASSWORD .env

# 如果没有设置或为空，docker-compose.yml 会使用默认值 "postgres"
```

**重要**：如果 `.env` 中设置了 `POSTGRES_PASSWORD`，确保：
- docker-compose.yml 中的 `postgres` 服务使用相同的密码
- docker-compose.yml 中的 `app` 服务的 `DATABASE_URL` 使用相同的密码

### 3. 重置数据库密码（如果需要）

如果密码不匹配，有两种方法：

**方法 A：修改 .env，使用默认密码 `postgres`**
```bash
# 编辑 .env，确保 POSTGRES_PASSWORD=postgres 或删除该行
nano .env
```

**方法 B：修改数据库密码以匹配 .env**
```bash
# 先启动数据库
docker compose up -d postgres

# 等待数据库就绪
sleep 5

# 修改数据库密码（将 'your-password' 替换为 .env 中的实际密码）
docker compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'your-password';"
```

### 4. 验证数据库连接

```bash
# 测试应用容器能否连接到数据库
docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ 数据库连接成功'); p.\$disconnect(); }).catch(e => { console.error('❌ 连接失败:', e.message); process.exit(1); });"
```

如果显示 "✅ 数据库连接成功"，说明连接正常。

### 5. 检查数据库中的数据

```bash
# 查看数据表是否存在数据
docker compose exec postgres psql -U postgres -d lego_price_king -c "SELECT COUNT(*) FROM lego_sets;"
```

### 6. 重新构建并启动应用

```bash
cd /opt/lego-price-king

# 停止所有服务
docker compose down

# 重新构建应用（使用 --no-cache 确保使用最新代码）
docker compose build --no-cache app

# 启动所有服务
docker compose up -d

# 查看应用日志，确认没有错误
docker compose logs app --tail 50
```

### 7. 验证修复

1. 访问 `http://你的服务器IP:3000/search` - 应该显示「最近录入」或搜索结果
2. 访问 `http://你的服务器IP:3000/set/10264-1` - 应该显示套装详情页

## 常见问题

### Q: 为什么数据库服务一直启动失败？

**A:** 检查端口是否被占用：
```bash
# 检查 5432 端口
netstat -tuln | grep 5432

# 如果被占用，可以修改 docker-compose.yml 中的端口映射
```

### Q: 应用日志显示 "DATABASE_URL 环境变量未设置"

**A:** 确保 `.env` 文件存在，并且 docker-compose.yml 中的 `env_file: - .env` 配置正确。

### Q: 修改密码后还是连接失败

**A:** 需要完全重启服务：
```bash
docker compose down
docker compose up -d
```

### Q: 数据丢失了怎么办？

**A:** 检查数据卷是否还在：
```bash
docker volume ls | grep postgres_data
```

如果数据卷存在，数据应该还在。如果删除了数据卷，需要重新导入数据。

## 预防措施

1. **统一密码管理**：在 `.env` 中设置 `POSTGRES_PASSWORD`，docker-compose.yml 会自动使用
2. **定期备份**：定期备份 `postgres_data` 数据卷
3. **监控日志**：定期检查 `docker compose logs app` 和 `docker compose logs postgres`
