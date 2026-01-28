# 数据库连接稳定性修复

## 问题描述

服务器长时间（18小时）未使用后，搜索功能和套装详情页无法使用，原因是数据库连接超时或断开后没有自动重连机制。

## 已实施的修复

### 1. Prisma 客户端改进 (`lib/prisma.ts`)

- ✅ **连接池配置**：添加了 `connection_limit=10`、`pool_timeout=20`、`connect_timeout=10` 参数
- ✅ **全局实例复用**：在所有环境（包括生产环境）复用 Prisma 实例，避免连接池耗尽
- ✅ **自动重连机制**：添加 `ensureConnection()` 函数，每次查询前检查连接状态
- ✅ **重试机制**：添加 `withRetry()` 函数，自动重试失败的数据库操作（最多2次）
- ✅ **错误处理**：识别连接相关错误（P1001, P1008, P1017）并自动重连

### 2. 页面和 API 更新

- ✅ **搜索页面** (`app/search/page.tsx`)：所有 Prisma 查询使用 `withRetry()` 包装
- ✅ **套装详情页** (`app/set/[setNumber]/page.tsx`)：所有 Prisma 查询使用 `withRetry()` 包装
- ✅ **价格刷新 API** (`app/api/refresh-prices/route.ts`)：所有 Prisma 操作使用 `withRetry()` 包装

### 3. Docker Compose 配置

- ✅ **DATABASE_URL 参数**：在 docker-compose.yml 中添加连接池参数

## 工作原理

### 连接检查流程

1. **每次查询前**：`withRetry()` 调用 `ensureConnection()` 检查连接
2. **连接检查**：执行 `SELECT 1` 简单查询验证连接
3. **连接失败**：自动断开并重新连接
4. **查询执行**：执行实际查询
5. **查询失败**：如果是连接错误，等待后重试（最多2次）

### 重试策略

- **第1次失败**：等待1秒后重试
- **第2次失败**：等待2秒后重试
- **第3次失败**：抛出错误

### 连接池参数说明

- `connection_limit=10`：最大连接数，避免过多连接
- `pool_timeout=20`：连接池超时时间（秒）
- `connect_timeout=10`：连接超时时间（秒）

## 部署步骤

### 1. 提交代码

```powershell
cd C:\Users\Administrator\lego-price-king
git add .
git commit -m "fix: 添加数据库连接自动重连和重试机制，确保长期稳定运行"
git push
```

### 2. 在服务器上部署

```bash
cd /opt/lego-price-king

# 拉取最新代码
git pull

# 重新构建应用（使用最新代码）
docker compose build --no-cache app

# 重启服务
docker compose down
docker compose up -d

# 查看日志确认启动成功
docker compose logs app --tail 50
```

### 3. 验证修复

1. **测试搜索功能**：
   - 访问 `http://你的服务器IP:3000/search`
   - 应该能正常显示「最近录入」或搜索结果

2. **测试套装详情页**：
   - 访问 `http://你的服务器IP:3000/set/10264-1`
   - 应该能正常显示套装详情

3. **等待长时间后再次测试**：
   - 等待几小时或过夜后再次访问
   - 应该仍然能正常工作（自动重连）

## 监控和调试

### 查看连接状态

```bash
# 查看应用日志中的连接相关信息
docker compose logs app | grep -i "connection\|重连\|连接"
```

### 手动测试连接

```bash
# 测试数据库连接
docker compose exec app node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ 数据库连接成功'); p.\$disconnect(); }).catch(e => { console.error('❌ 连接失败:', e.message); process.exit(1); });"
```

### 查看 Prisma 连接池状态

```bash
# 查看应用日志中的 Prisma 相关信息
docker compose logs app | grep -i "prisma\|query"
```

## 预期效果

修复后，系统应该能够：

1. ✅ **自动处理连接超时**：长时间未使用后，首次查询会自动重连
2. ✅ **自动重试失败操作**：网络波动导致的失败会自动重试
3. ✅ **避免连接池耗尽**：全局复用 Prisma 实例，合理管理连接数
4. ✅ **优雅降级**：连接失败时显示友好错误提示，而不是崩溃

## 如果问题仍然存在

如果修复后仍然出现问题，请检查：

1. **数据库服务状态**：
   ```bash
   docker compose ps
   # 确保 postgres 服务状态为 healthy
   ```

2. **数据库日志**：
   ```bash
   docker compose logs postgres --tail 50
   ```

3. **应用日志**：
   ```bash
   docker compose logs app --tail 100 | grep -i "error\|connection\|prisma"
   ```

4. **网络连接**：
   ```bash
   # 从应用容器 ping 数据库容器
   docker compose exec app ping -c 3 postgres
   ```

## 技术细节

### Prisma 错误代码

- `P1001`：无法连接到数据库服务器
- `P1008`：操作超时
- `P1017`：服务器关闭了连接

这些错误都会被 `withRetry()` 自动处理。

### 连接池最佳实践

- **连接数**：根据并发请求数设置，10个连接通常足够
- **超时时间**：根据网络延迟设置，20秒超时适合大多数场景
- **连接复用**：全局复用 Prisma 实例，避免频繁创建新连接
