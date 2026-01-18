# 数据上传指南

## 📤 上传 2019 年数据到服务器

### 步骤 1: 准备环境

确保您已经：
1. ✅ 在项目根目录配置了 `.env` 文件
2. ✅ 配置了 `REMOTE_DATABASE_URL`（远程数据库连接）
3. ✅ 安装了脚本依赖

### 步骤 2: 安装依赖（如果还没安装）

```powershell
cd C:\Users\Administrator\lego-price-king
cd scripts
npm install
```

### 步骤 3: 上传数据

在项目根目录执行：

```powershell
cd C:\Users\Administrator\lego-price-king
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

**注意**: 
- 如果路径包含空格，需要用引号括起来
- 路径中的反斜杠 `\` 需要转义为 `\\` 或使用正斜杠 `/`

### 步骤 4: 查看同步结果

脚本会显示：
- ✅ 读取的记录数
- ✅ 每条记录的同步状态
- ✅ 最终统计信息

---

## 🔍 数据列名映射

脚本会自动识别以下列名（不区分大小写）：

| 数据库字段 | 可能的 Excel 列名 |
|-----------|------------------|
| setNumber | `编号`, `SET NUMBER`, `Set Number`, `set_number` |
| name | `名称`, `NAME`, `Name`, `set_name` |
| theme | `主题`, `THEME`, `Theme`, `theme_name` |
| subTheme | `子主题`, `SUB THEME`, `Sub Theme`, `sub_theme` |
| year | `年份`, `YEAR`, `Year`, `year_released` |
| minifigs | `人仔数`, `MINIFIGS`, `Minifigs`, `minifigs` |
| imageUrl | `图片链接`, `Image URL`, `image_url` |

---

## ⚠️ 常见问题

### 问题 1: 找不到文件

**错误**: `文件不存在`

**解决**: 
- 检查文件路径是否正确
- 使用绝对路径
- 确保路径用引号括起来

### 问题 2: 数据库连接失败

**错误**: `请配置 DATABASE_URL 或 REMOTE_DATABASE_URL`

**解决**:
1. 检查 `.env` 文件是否存在
2. 确认 `REMOTE_DATABASE_URL` 已配置
3. 格式: `postgresql://postgres:密码@服务器IP:5432/lego_price_king?schema=public`

### 问题 3: 列名不匹配

**错误**: 数据不完整，跳过

**解决**:
1. 查看脚本输出的"数据列名示例"
2. 如果列名不同，可以修改脚本中的列名映射
3. 或修改 Excel 文件的列名

### 问题 4: 图片上传失败

**提示**: 如果未配置 OSS，图片上传会跳过，只上传数据

**解决**:
- 图片上传是可选的
- 如果不需要上传图片，可以不配置 OSS
- 数据会正常同步，只是 `imageUrl` 为空

---

## 📋 上传后的操作

### 1. 验证数据

在服务器上检查数据：

```bash
# SSH 连接到服务器
ssh root@8.138.110.247

# 进入项目目录
cd /opt/lego-price-king

# 连接到数据库查看
docker compose exec postgres psql -U postgres -d lego_price_king

# 查看记录数
SELECT COUNT(*) FROM lego_sets;

# 查看最近添加的记录
SELECT "setNumber", name, theme, year FROM lego_sets ORDER BY "createdAt" DESC LIMIT 10;

# 退出数据库
\q
```

### 2. 在网站上查看

访问网站查看数据：
```
http://8.138.110.247:3000
```

搜索一个 2019 年的套装编号，确认数据已显示。

### 3. 同步价格信息（可选）

如果需要为这些套装获取价格信息：

1. 在网站上搜索套装
2. 进入套装详情页
3. 点击"更新价格"按钮
4. 系统会从淘宝联盟 API 获取价格

**注意**: 价格更新需要配置淘宝联盟 API。

---

## 🚀 批量上传多个年份的数据

如果您有多个年份的 Excel 文件，可以依次执行：

```powershell
# 上传 2019 年数据
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"

# 上传 2020 年数据（如果有）
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2020.xlsx"

# 以此类推...
```

---

## 📊 数据统计查询

上传完成后，可以在数据库中查询统计信息：

```sql
-- 按年份统计
SELECT year, COUNT(*) as count 
FROM lego_sets 
GROUP BY year 
ORDER BY year DESC;

-- 按主题统计
SELECT theme, COUNT(*) as count 
FROM lego_sets 
GROUP BY theme 
ORDER BY count DESC 
LIMIT 20;

-- 查看有图片的记录数
SELECT COUNT(*) 
FROM lego_sets 
WHERE "imageUrl" != '' AND "imageUrl" IS NOT NULL;
```

---

## ✅ 完成检查清单

上传数据后，确认：

- [ ] 脚本执行成功，没有错误
- [ ] 数据库中可以看到新记录
- [ ] 网站可以搜索到新数据
- [ ] 数据字段完整（名称、主题、年份等）
- [ ] 图片已上传（如果配置了 OSS）

如果所有项目都完成，数据同步就成功了！
