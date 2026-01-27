/**
 * 测试远程数据库连接
 * 在项目根目录执行：node scripts/test-db.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require(path.join(__dirname, '../node_modules/@prisma/client'));

// 使用 REMOTE_DATABASE_URL 测试远程连接（与 sync_data2019.js 一致）
const p = new PrismaClient({
  datasources: {
    db: {
      url: process.env.REMOTE_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});
p.$connect()
  .then(() => {
    console.log('数据库连接成功');
    p.$disconnect();
  })
  .catch(e => {
    console.error('连接失败:', e.message);
    p.$disconnect();
  });
