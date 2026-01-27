/**
 * 乐高比价王 - data2019.xlsx 专用导入脚本
 *
 * 列映射（与 data2019.xlsx 一致）：
 *   编号 -> setNumber
 *   名称 -> name
 *   主题 -> theme
 *   子主题 -> subTheme
 *   年份 -> year
 *   人仔数 -> minifigs
 *   图片 -> 不使用 Excel 的「图片链接」；图片放服务器 public/images/，文件名为「编号.jpg」
 *          imageUrl 固定为 /images/{编号}.jpg（可通过第二参数改为 .png）
 *
 * 使用：
 *   在项目根目录执行：
 *   node scripts/sync_data2019.js "F:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
 *   node scripts/sync_data2019.js "Excel路径" [.jpg|.png]   # 第二个参数为图片扩展名，默认 .jpg
 *
 * 依赖：需先配置 .env 中的 REMOTE_DATABASE_URL（或 DATABASE_URL），并已执行 npx prisma generate
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 使用项目根目录的 @prisma/client（需先在根目录执行 npx prisma generate）
let PrismaClient;
try {
  PrismaClient = require(path.join(__dirname, '../node_modules/@prisma/client')).PrismaClient;
} catch (e) {
  console.error('❌ 无法加载 Prisma 客户端。请先在项目根目录执行：');
  console.error('   npx prisma generate');
  console.error('若尚未安装依赖，请先执行：npm install');
  process.exit(1);
}

const EXCEL_PATH = process.argv[2] || process.env.EXCEL_PATH_2019;
const IMAGE_EXT = (process.argv[3] || '.jpg').replace(/^\.?/, '.'); // 保证是 .jpg / .png
const BATCH_SIZE = 50;

if (!EXCEL_PATH) {
  console.error('❌ 请提供 Excel 文件路径（参数或环境变量 EXCEL_PATH_2019）');
  console.log('\n示例:');
  console.log('  node scripts/sync_data2019.js "F:\\DS218+\\SynologyDrive\\brickmaster\\brickset 数据\\data2019.xlsx"');
  console.log('  node scripts/sync_data2019.js "路径" .png');
  console.log('  set EXCEL_PATH_2019=F:\\...\\data2019.xlsx  然后  node scripts/sync_data2019.js');
  process.exit(1);
}
if (!fs.existsSync(EXCEL_PATH)) {
  console.error('❌ 文件不存在:', EXCEL_PATH);
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.REMOTE_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

function readExcel(p) {
  const workbook = XLSX.readFile(p);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

function toInt(v) {
  if (v == null || v === '') return null;
  const n = parseInt(String(v).trim(), 10);
  return isNaN(n) ? null : n;
}

function toStr(v) {
  if (v == null) return '';
  const s = String(v).trim();
  return s === 'undefined' || s === 'null' ? '' : s;
}

async function main() {
  console.log('📂 Excel:', EXCEL_PATH);
  console.log('🖼️  图片扩展名:', IMAGE_EXT, '（imageUrl = /images/{编号}' + IMAGE_EXT + '）\n');

  if (!process.env.REMOTE_DATABASE_URL && !process.env.DATABASE_URL) {
    console.error('❌ 请配置 .env 中的 REMOTE_DATABASE_URL 或 DATABASE_URL');
    process.exit(1);
  }

  const records = readExcel(EXCEL_PATH);
  console.log('📋 共', records.length, '行\n');

  let ok = 0, skip = 0, err = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    console.log(`📦 批次 ${batchNum}/${totalBatches} (${i + 1}–${i + batch.length}/${records.length})`);

    for (let j = 0; j < batch.length; j++) {
      const r = batch[j];
      const idx = i + j + 1;

      const setNumber = toStr(r['编号']);
      if (!setNumber) {
        console.warn(`  ⚠ [${idx}] 无编号，跳过`);
        skip++;
        continue;
      }

      const name = toStr(r['名称']);
      const theme = toStr(r['主题']);
      const year = toInt(r['年份']);

      if (!name || !theme || !year) {
        console.warn(`  ⚠ [${idx}] 缺名称/主题/年份，跳过:`, setNumber);
        skip++;
        continue;
      }

      const subTheme = toStr(r['子主题']) || null;
      const minifigs = toInt(r['人仔数']);
      // 图片：不使用 Excel 的「图片链接」，统一用服务器路径 /images/{编号}.jpg
      const imageUrl = `/images/${setNumber}${IMAGE_EXT}`;

      const data = {
        setNumber,
        name,
        imageUrl,
        theme,
        subTheme: subTheme || null,
        year,
        minifigs,
        lastPrice: null,
        priceHistory: null,
      };

      try {
        await prisma.legoSet.upsert({
          where: { setNumber },
          update: data,
          create: data,
        });
        console.log(`  ✅ [${idx}] ${setNumber} - ${name}`);
        ok++;
      } catch (e) {
        console.error(`  ❌ [${idx}] ${setNumber}:`, e.message);
        err++;
      }
    }

    if (i + BATCH_SIZE < records.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log('\n' + '—'.repeat(50));
  console.log('✅ 成功:', ok, ' | ⚠ 跳过:', skip, ' | ❌ 失败:', err);
  console.log('—'.repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
