# 快速修复搜索功能

## 如果搜索页面显示 "Application error"

### 1. 立即检查服务器日志

```bash
cd /opt/lego-price-king

# 查看应用日志中的错误
docker compose logs app --tail 100 | grep -i "error\|exception\|prisma\|connection"
```

### 2. 检查数据库服务状态

```bash
# 检查服务是否都在运行
docker compose ps

# 如果 postgres 服务未运行或状态不是 healthy，重启
docker compose restart postgres
sleep 5
docker compose ps
```

### 3. 测试数据库连接

```bash
# 测试应用能否连接到数据库
docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ 数据库连接成功'); p.\$disconnect(); }).catch(e => { console.error('❌ 连接失败:', e.message); process.exit(1); });"
```

### 4. 如果连接失败，重置数据库密码

```bash
# 重置数据库密码为 postgres（与 docker-compose.yml 默认值一致）
docker exec -it lego_price_king_db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"

# 重启应用
docker compose restart app

# 再次测试连接
docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ 数据库连接成功'); p.\$disconnect(); }).catch(e => { console.error('❌ 连接失败:', e.message); process.exit(1); });"
```

### 5. 如果代码已更新，重新部署

```bash
cd /opt/lego-price-king

# 拉取最新代码
git pull

# 重新构建应用
docker compose build --no-cache app

# 重启服务
docker compose down
docker compose up -d

# 等待服务启动
sleep 10

# 查看日志
docker compose logs app --tail 50
```

### 6. 验证修复

访问以下页面，应该能正常显示：
- `http://你的服务器IP:3000/search` - 搜索页面
- `http://你的服务器IP:3000/set/10264-1` - 套装详情页

## 常见错误和解决方案

### 错误：`Authentication failed`

**原因**：数据库密码不匹配

**解决**：
```bash
docker exec -it lego_price_king_db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
docker compose restart app
```

### 错误：`P1001` 或 `ECONNREFUSED`

**原因**：数据库服务未运行或网络问题

**解决**：
```bash
docker compose ps
# 如果 postgres 未运行：
docker compose up -d postgres
# 等待健康检查通过
sleep 10
docker compose restart app
```

### 错误：`PrismaClientInitializationError`

**原因**：Prisma Client 未正确生成或连接配置错误

**解决**：
```bash
docker compose exec app npx prisma generate
docker compose restart app
```

## 一键修复脚本

如果以上步骤都失败，执行以下完整重置：

```bash
cd /opt/lego-price-king

# 1. 停止所有服务
docker compose down

# 2. 重置数据库密码（如果数据库容器还在）
docker exec lego_price_king_db psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || echo "数据库容器未运行"

# 3. 拉取最新代码
git pull

# 4. 重新构建
docker compose build --no-cache app

# 5. 启动服务
docker compose up -d

# 6. 等待服务就绪
sleep 15

# 7. 检查状态
docker compose ps

# 8. 查看日志
docker compose logs app --tail 50
```

## 如果仍然无法解决

请提供以下信息：

1. **应用日志**：
   ```bash
   docker compose logs app --tail 100
   ```

2. **数据库日志**：
   ```bash
   docker compose logs postgres --tail 50
   ```

3. **服务状态**：
   ```bash
   docker compose ps
   ```

4. **数据库连接测试结果**：
   ```bash
   docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ 成功'); p.\$disconnect(); }).catch(e => { console.error('❌ 失败:', e.message); });"
   ```
