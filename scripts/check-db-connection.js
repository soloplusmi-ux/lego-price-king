#!/usr/bin/env node

/**
 * 数据库连接检查脚本
 * 在应用启动前检查数据库连接是否正常
 */

const { PrismaClient } = require('@prisma/client');

async function checkDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('正在检查数据库连接...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '❌ 未设置');
    
    // 尝试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 尝试执行一个简单查询
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 数据库查询测试成功');
    
    // 检查表是否存在
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lego_sets'
      );
    `;
    
    const tableExists = result[0]?.exists;
    if (tableExists) {
      console.log('✅ lego_sets 表存在');
      
      // 检查数据
      const count = await prisma.legoSet.count();
      console.log(`✅ 数据库中有 ${count} 条记录`);
    } else {
      console.warn('⚠️  lego_sets 表不存在，可能需要运行 prisma db push');
    }
    
    await prisma.$disconnect();
    console.log('✅ 数据库连接检查完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接检查失败:');
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    
    if (error.meta) {
      console.error('详细信息:', JSON.stringify(error.meta, null, 2));
    }
    
    await prisma.$disconnect().catch(() => {});
    
    console.error('\n请检查:');
    console.error('1. 数据库服务是否运行: docker compose ps');
    console.error('2. DATABASE_URL 是否正确: docker compose exec app printenv DATABASE_URL');
    console.error('3. 数据库密码是否匹配: docker exec -it lego_price_king_db psql -U postgres -c "SELECT 1;"');
    
    process.exit(1);
  }
}

checkDatabaseConnection();
