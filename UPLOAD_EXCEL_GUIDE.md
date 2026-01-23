# Excel 数据上传指南

## 📋 字段映射说明

根据您的要求，Excel 字段与数据库字段的对应关系：

| Excel 列名 | 数据库字段 | 说明 |
|-----------|----------|------|
| 编号 | setNumber | 必填，唯一标识 |
| 名称 | name | 必填 |
| 主题 | theme | 必填 |
| 年份 | year | 必填，整数 |
| 人仔数 | minifigs | 可选，整数 |
| 淘宝售价中位数 | lastPrice | 可选，浮点数 |
| 图表 | priceHistory | 可选，JSON 格式的价格历史数据 |

---

## 🚀 上传步骤

### 步骤 1: 准备环境变量

确保本地 `.env` 文件包含以下配置：

```env
# 远程数据库连接（服务器上的数据库）
REMOTE_DATABASE_URL="postgresql://postgres:postgres@8.138.110.247:5432/lego_price_king?schema=public"

# 阿里云 OSS 配置（用于上传图片）
ALIYUN_OSS_REGION="oss-cn-hangzhou"
ALIYUN_OSS_ACCESS_KEY_ID="您的AccessKeyId"
ALIYUN_OSS_ACCESS_KEY_SECRET="您的AccessKeySecret"
ALIYUN_OSS_BUCKET="您的Bucket名称"
```

---

### 步骤 2: 准备图片（可选）

如果有图片需要上传，将图片放在：
```
data/images/
```

图片文件名应该与 Excel 中的"编号"一致，例如：
- `10294.jpg`（如果编号是 10294）
- `10294.png`

支持的图片格式：`.jpg`, `.jpeg`, `.png`, `.webp`

---

### 步骤 3: 运行上传脚本

在项目根目录执行：

```powershell
cd C:\Users\Administrator\lego-price-king

node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

---

## 📊 Excel 文件格式要求

### 必需的列：
- **编号**：乐高套装的编号（唯一标识）
- **名称**：套装名称
- **主题**：主题名称
- **年份**：发布年份（整数）

### 可选的列：
- **子主题**：子主题名称
- **人仔数**：人仔数量（整数）
- **淘宝售价中位数**：当前中位数价格（浮点数）
- **图表**：价格历史数据（JSON 格式）

### 图表字段格式（如果提供）：

如果 Excel 中有"图表"列，应该是 JSON 格式的字符串，例如：

```json
[
  {"date": "2024-01-01", "price": 299.00},
  {"date": "2024-01-08", "price": 305.50},
  {"date": "2024-01-15", "price": 310.00}
]
```

如果没有提供，脚本会自动设置为 `null`。

---

## ✅ 脚本执行过程

脚本会：
1. 读取 Excel 文件
2. 显示数据列名（用于验证）
3. 批量处理记录（每批 50 条）
4. 上传图片到 OSS（如果存在）
5. 同步数据到数据库
6. 显示进度和结果

---

## 🔍 验证数据

上传完成后，访问网站查看数据：

```
http://8.138.110.247:3000
```

---

## ⚠️ 常见问题

### 问题 1: 连接数据库失败

**错误：** `Can't reach database server`

**解决：**
- 检查服务器 IP 是否正确：`8.138.110.247`
- 检查端口是否开放：`5432`
- 检查数据库密码是否正确

### 问题 2: 字段映射错误

**错误：** 某些字段显示为空

**解决：**
- 检查 Excel 列名是否与脚本支持的列名匹配
- 脚本支持多种列名格式（中文、英文、下划线等）

### 问题 3: 图片上传失败

**错误：** 图片未上传

**解决：**
- 检查 OSS 配置是否正确
- 检查图片文件是否存在
- 图片文件名应与"编号"一致

---

告诉我执行结果！
