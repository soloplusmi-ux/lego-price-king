/**
 * 乐高比价王 - 本地数据同步脚本
 * 
 * 此脚本运行在用户的本地机器上，用于将 Excel 数据和图片上传到远程服务器
 * 
 * 使用方法:
 * 1. 在项目根目录创建 .env 文件，配置远程数据库和 OSS 信息
 * 2. 准备 Excel 文件: data/excel/lego_sets.xlsx
 * 3. 准备图片文件夹: data/images/
 * 4. 运行: node scripts/sync_data.js
 */

require('dotenv').config();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const OSS = require('ali-oss');

// 配置
const EXCEL_PATH = path.join(__dirname, '../data/excel/lego_sets.xlsx');
const IMAGES_DIR = path.join(__dirname, '../data/images/');
const BATCH_SIZE = 50; // 每批处理的数量

// 初始化 Prisma Client (连接到远程数据库)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.REMOTE_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

// 初始化阿里云 OSS
const ossClient = new OSS({
  region: process.env.ALIYUN_OSS_REGION,
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.ALIYUN_OSS_BUCKET,
});

/**
 * 上传图片到 OSS
 */
async function uploadImageToOSS(imagePath, setNumber) {
  try {
    const ext = path.extname(imagePath);
    const fileName = `lego-sets/${setNumber}${ext}`;
    
    const result = await ossClient.put(fileName, imagePath);
    return result.url;
  } catch (error) {
    console.error(`上传图片失败 ${imagePath}:`, error.message);
    return null;
  }
}

/**
 * 查找对应的图片文件
 */
function findImageFile(setNumber) {
  const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  for (const ext of possibleExtensions) {
    const imagePath = path.join(IMAGES_DIR, `${setNumber}${ext}`);
    if (fs.existsSync(imagePath)) {
      return imagePath;
    }
  }
  
  // 尝试查找包含编号的文件名
  const files = fs.readdirSync(IMAGES_DIR);
  const matchingFile = files.find(file => 
    file.toLowerCase().includes(setNumber.toLowerCase())
  );
  
  if (matchingFile) {
    return path.join(IMAGES_DIR, matchingFile);
  }
  
  return null;
}

/**
 * 读取 Excel 文件
 */
function readExcelFile() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Excel 文件不存在: ${EXCEL_PATH}`);
  }
  
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`读取到 ${data.length} 条记录`);
  return data;
}

/**
 * 处理单条记录
 */
async function processRecord(record, index, total) {
  try {
    const setNumber = String(record.setNumber || record['编号'] || record['SET NUMBER']).trim();
    
    if (!setNumber) {
      console.warn(`第 ${index + 1} 条记录缺少编号，跳过`);
      return;
    }
    
    // 查找并上传图片
    let imageUrl = record.imageUrl || record['图片链接'];
    const imagePath = findImageFile(setNumber);
    
    if (imagePath && !imageUrl) {
      console.log(`[${index + 1}/${total}] 上传图片: ${setNumber}`);
      imageUrl = await uploadImageToOSS(imagePath, setNumber);
      
      if (!imageUrl) {
        console.warn(`图片上传失败，使用空字符串: ${setNumber}`);
        imageUrl = '';
      }
    }
    
    // 准备数据
    const legoSetData = {
      setNumber,
      name: String(record.name || record['名称'] || record['NAME'] || '').trim(),
      imageUrl: imageUrl || '',
      theme: String(record.theme || record['主题'] || record['THEME'] || '').trim(),
      subTheme: record.subTheme || record['子主题'] || record['SUB THEME'] || null,
      year: parseInt(record.year || record['年份'] || record['YEAR'] || '0', 10),
      minifigs: record.minifigs || record['人仔数'] || record['MINIFIGS'] 
        ? parseInt(record.minifigs || record['人仔数'] || record['MINIFIGS'], 10) 
        : null,
      lastPrice: record.lastPrice || record['最近价格'] || null,
      priceHistory: record.priceHistory || null,
    };
    
    // 验证必填字段
    if (!legoSetData.name || !legoSetData.theme || !legoSetData.year) {
      console.warn(`第 ${index + 1} 条记录数据不完整，跳过:`, setNumber);
      return;
    }
    
    // Upsert 到数据库
    await prisma.legoSet.upsert({
      where: { setNumber },
      update: legoSetData,
      create: legoSetData,
    });
    
    console.log(`[${index + 1}/${total}] ✓ 同步成功: ${setNumber} - ${legoSetData.name}`);
  } catch (error) {
    console.error(`处理第 ${index + 1} 条记录时出错:`, error.message);
  }
}

/**
 * 批量处理记录
 */
async function processBatch(records, startIndex) {
  const batch = records.slice(startIndex, startIndex + BATCH_SIZE);
  
  await Promise.all(
    batch.map((record, i) => 
      processRecord(record, startIndex + i, records.length)
    )
  );
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始同步数据...\n');
  
  try {
    // 检查配置
    if (!process.env.DATABASE_URL && !process.env.REMOTE_DATABASE_URL) {
      throw new Error('请配置 DATABASE_URL 或 REMOTE_DATABASE_URL');
    }
    
    if (!process.env.ALIYUN_OSS_ACCESS_KEY_ID) {
      throw new Error('请配置阿里云 OSS 相关环境变量');
    }
    
    // 读取 Excel
    const records = readExcelFile();
    
    if (records.length === 0) {
      console.log('Excel 文件中没有数据');
      return;
    }
    
    // 批量处理
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      console.log(`\n处理批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(records.length / BATCH_SIZE)}`);
      await processBatch(records, i);
      
      // 短暂延迟，避免过载
      if (i + BATCH_SIZE < records.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n✅ 数据同步完成！');
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { main };
