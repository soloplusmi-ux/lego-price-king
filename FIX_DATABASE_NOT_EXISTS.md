# 修复数据库不存在问题

## 问题症状

错误信息：`Database 'lego_price_king' does not exist on the database server at 'postgres:5432'`

## 根本原因

虽然 `docker-compose.yml` 中设置了 `POSTGRES_DB: lego_price_king`，但在某些情况下（如数据卷被清空、容器重启等），数据库可能没有被正确创建。

## 已实施的修复

### 1. 更新启动命令

在 `docker-compose.yml` 的 `app` 服务启动命令中添加了：
1. **数据库存在性检查**：检查数据库是否存在，不存在则创建
2. **表结构同步**：使用 `prisma db push` 确保表结构存在

### 2. 改进健康检查

将 PostgreSQL 的健康检查从 `pg_isready -U postgres` 改为 `pg_isready -U postgres -d lego_price_king`，确保数据库存在时才认为健康。

## 快速修复步骤

### 方法 1：使用更新后的代码（推荐）

```bash
cd /opt/lego-price-king

# 拉取最新代码
git pull

# 重新构建并启动
docker compose down
docker compose build --no-cache app
docker compose up -d

# 查看启动日志
docker compose logs app --tail 100
```

启动日志应该显示：
- ✅ 数据库 lego_price_king 已确认存在
- ✅ Prisma Client 生成完成
- ✅ 数据库表结构已同步
- 🚀 启动应用...

### 方法 2：手动创建数据库（临时修复）

如果无法立即更新代码，可以手动创建数据库：

```bash
cd /opt/lego-price-king

# 1. 检查数据库是否存在
docker exec -it lego_price_king_db psql -U postgres -l | grep lego_price_king

# 2. 如果不存在，创建数据库
docker exec -it lego_price_king_db psql -U postgres -c "CREATE DATABASE lego_price_king;"

# 3. 同步表结构
docker compose exec app npx prisma db push --accept-data-loss

# 4. 重启应用
docker compose restart app
```

### 方法 3：完全重置（如果数据可以丢失）

```bash
cd /opt/lego-price-king

# 1. 停止所有服务
docker compose down

# 2. 删除数据卷（⚠️ 这会删除所有数据）
docker volume rm lego_price_king_postgres_data

# 3. 重新启动
docker compose up -d

# 4. 等待数据库初始化
sleep 10

# 5. 同步表结构
docker compose exec app npx prisma db push --accept-data-loss

# 6. 查看日志确认
docker compose logs app --tail 50
```

## 验证修复

### 1. 检查数据库是否存在

```bash
docker exec -it lego_price_king_db psql -U postgres -l | grep lego_price_king
```

应该看到 `lego_price_king` 数据库。

### 2. 检查表是否存在

```bash
docker exec -it lego_price_king_db psql -U postgres -d lego_price_king -c "\dt"
```

应该看到 `lego_sets` 表。

### 3. 测试应用

访问以下页面，应该能正常工作：
- `http://你的服务器IP:3000/search` - 搜索页面
- `http://你的服务器IP:3000/set/10264-1` - 套装详情页

## 预防措施

1. **数据备份**：定期备份 `postgres_data` 数据卷
2. **监控日志**：定期检查 `docker compose logs app` 和 `docker compose logs postgres`
3. **健康检查**：确保健康检查正确配置，数据库存在时才认为健康

## 如果问题仍然存在

请提供以下信息：

1. **数据库列表**：
   ```bash
   docker exec -it lego_price_king_db psql -U postgres -l
   ```

2. **应用启动日志**：
   ```bash
   docker compose logs app --tail 100
   ```

3. **数据库日志**：
   ```bash
   docker compose logs postgres --tail 50
   ```

4. **服务状态**：
   ```bash
   docker compose ps
   ```
