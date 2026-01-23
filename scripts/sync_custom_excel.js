/**
 * 乐高比价王 - 自定义 Excel 文件同步脚本
 * 
 * 此脚本用于同步指定的 Excel 文件到远程数据库
 * 
 * 使用方法:
 * node scripts/sync_custom_excel.js <excel文件路径>
 * 
 * 示例:
 * node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
 */

require('dotenv').config();
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const OSS = require('ali-oss');

// 从命令行参数获取 Excel 文件路径
const EXCEL_PATH = process.argv[2];

if (!EXCEL_PATH) {
  console.error('❌ 错误: 请提供 Excel 文件路径');
  console.log('\n使用方法:');
  console.log('  node scripts/sync_custom_excel.js <excel文件路径>');
  console.log('\n示例:');
  console.log('  node scripts/sync_custom_excel.js "f:\\DS218+\\SynologyDrive\\brickmaster\\brickset 数据\\data2019.xlsx"');
  process.exit(1);
}

// 检查文件是否存在
if (!fs.existsSync(EXCEL_PATH)) {
  console.error(`❌ 错误: 文件不存在: ${EXCEL_PATH}`);
  process.exit(1);
}

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

// 初始化阿里云 OSS（如果配置了）
let ossClient = null;
if (process.env.ALIYUN_OSS_ACCESS_KEY_ID) {
  ossClient = new OSS({
    region: process.env.ALIYUN_OSS_REGION,
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
    bucket: process.env.ALIYUN_OSS_BUCKET,
  });
}

/**
 * 上传图片到 OSS
 */
async function uploadImageToOSS(imagePath, setNumber) {
  if (!ossClient) {
    return null;
  }
  
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
  if (!fs.existsSync(IMAGES_DIR)) {
    return null;
  }
  
  const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  for (const ext of possibleExtensions) {
    const imagePath = path.join(IMAGES_DIR, `${setNumber}${ext}`);
    if (fs.existsSync(imagePath)) {
      return imagePath;
    }
  }
  
  // 尝试查找包含编号的文件名
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const matchingFile = files.find(file => 
      file.toLowerCase().includes(setNumber.toLowerCase())
    );
    
    if (matchingFile) {
      return path.join(IMAGES_DIR, matchingFile);
    }
  } catch (error) {
    // 忽略错误
  }
  
  return null;
}

/**
 * 读取 Excel 文件
 */
function readExcelFile() {
  console.log(`📖 读取 Excel 文件: ${EXCEL_PATH}`);
  
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`✅ 读取到 ${data.length} 条记录\n`);
  
  // 显示前几条记录的结构（用于调试）
  if (data.length > 0) {
    console.log('📋 数据列名示例:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('');
  }
  
  return data;
}

/**
 * 处理单条记录
 */
async function processRecord(record, index, total) {
  try {
    // 尝试多种可能的列名
    const setNumber = String(
      record.setNumber || 
      record['编号'] || 
      record['SET NUMBER'] || 
      record['Set Number'] ||
      record['set_number'] ||
      record['Set_Number'] ||
      record['编号'] ||
      ''
    ).trim();
    
    if (!setNumber || setNumber === 'undefined' || setNumber === 'null') {
      console.warn(`⚠️  第 ${index + 1} 条记录缺少编号，跳过`);
      return;
    }
    
    // 查找并上传图片
    let imageUrl = record.imageUrl || record['图片链接'] || record['Image URL'] || '';
    const imagePath = findImageFile(setNumber);
    
    if (imagePath && !imageUrl) {
      console.log(`[${index + 1}/${total}] 📤 上传图片: ${setNumber}`);
      imageUrl = await uploadImageToOSS(imagePath, setNumber);
      
      if (!imageUrl) {
        imageUrl = '';
      }
    }
    
    // 准备数据 - 尝试多种可能的列名
    const legoSetData = {
      setNumber,
      name: String(
        record.name || 
        record['名称'] || 
        record['NAME'] || 
        record['Name'] ||
        record['set_name'] ||
        ''
      ).trim(),
      imageUrl: imageUrl || '',
      theme: String(
        record.theme || 
        record['主题'] || 
        record['THEME'] || 
        record['Theme'] ||
        record['theme_name'] ||
        ''
      ).trim(),
      subTheme: (
        record.subTheme || 
        record['子主题'] || 
        record['SUB THEME'] || 
        record['Sub Theme'] ||
        record['sub_theme'] ||
        null
      ) ? String(record.subTheme || record['子主题'] || record['SUB THEME'] || record['Sub Theme'] || record['sub_theme']).trim() : null,
      year: parseInt(
        record.year || 
        record['年份'] || 
        record['YEAR'] || 
        record['Year'] ||
        record['year_released'] ||
        '0'
      , 10),
      minifigs: (
        record.minifigs || 
        record['人仔数'] || 
        record['MINIFIGS'] || 
        record['Minifigs'] ||
        record['minifigs'] ||
        null
      ) ? parseInt(record.minifigs || record['人仔数'] || record['MINIFIGS'] || record['Minifigs'] || record['minifigs'], 10) : null,
      lastPrice: (
        record.lastPrice || 
        record['淘宝售价中位数'] || 
        record['最近价格'] || 
        record['Last Price'] ||
        record['last_price'] ||
        null
      ) ? parseFloat(record.lastPrice || record['淘宝售价中位数'] || record['最近价格'] || record['Last Price'] || record['last_price'] || 0) : null,
      priceHistory: (
        record.priceHistory || 
        record['图表'] || 
        record['Price History'] ||
        record['price_history'] ||
        null
      ) ? (typeof (record.priceHistory || record['图表'] || record['Price History'] || record['price_history']) === 'string' 
        ? JSON.parse(record.priceHistory || record['图表'] || record['Price History'] || record['price_history'])
        : (record.priceHistory || record['图表'] || record['Price History'] || record['price_history'])
      ) : null,
    };
    
    // 验证必填字段
    if (!legoSetData.name || !legoSetData.theme || !legoSetData.year || legoSetData.year === 0) {
      console.warn(`⚠️  第 ${index + 1} 条记录数据不完整，跳过:`, {
        setNumber,
        name: legoSetData.name,
        theme: legoSetData.theme,
        year: legoSetData.year
      });
      return;
    }
    
    // Upsert 到数据库
    await prisma.legoSet.upsert({
      where: { setNumber },
      update: legoSetData,
      create: legoSetData,
    });
    
    console.log(`[${index + 1}/${total}] ✅ 同步成功: ${setNumber} - ${legoSetData.name}`);
  } catch (error) {
    console.error(`❌ 处理第 ${index + 1} 条记录时出错:`, error.message);
    if (error.message.includes('Unique constraint')) {
      console.error(`   提示: 编号 ${record.setNumber || record['编号']} 可能已存在`);
    }
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
  console.log(`📁 Excel 文件: ${EXCEL_PATH}\n`);
  
  try {
    // 检查配置
    if (!process.env.DATABASE_URL && !process.env.REMOTE_DATABASE_URL) {
      throw new Error('请配置 DATABASE_URL 或 REMOTE_DATABASE_URL');
    }
    
    // 读取 Excel
    const records = readExcelFile();
    
    if (records.length === 0) {
      console.log('⚠️  Excel 文件中没有数据');
      return;
    }
    
    // 统计信息
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // 批量处理
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      console.log(`\n📦 处理批次 ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, records.length)}/${records.length})`);
      
      const beforeCount = successCount;
      await processBatch(records, i);
      
      // 短暂延迟，避免过载
      if (i + BATCH_SIZE < records.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 数据同步完成！');
    console.log(`📊 总计: ${records.length} 条记录`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    console.error(error.stack);
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
