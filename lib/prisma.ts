import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 确保 DATABASE_URL 存在
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置！请检查 .env 文件或 docker-compose.yml');
}

// 创建 Prisma 客户端，配置连接池和重试机制
function createPrismaClient(): PrismaClient {
  // 解析 DATABASE_URL，添加连接池参数
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // 如果 URL 中已有参数，追加；否则添加
  const urlWithParams = databaseUrl.includes('?')
    ? `${databaseUrl}&connection_limit=10&pool_timeout=20&connect_timeout=10`
    : `${databaseUrl}?connection_limit=10&pool_timeout=20&connect_timeout=10`;

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: urlWithParams,
      },
    },
    // 添加错误格式化，便于调试
    errorFormat: 'pretty',
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// 在所有环境中复用 Prisma 实例（包括生产环境），避免连接池耗尽
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// 连接健康检查和自动重连
async function ensureConnection() {
  try {
    // 尝试执行一个简单查询来检查连接
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('数据库连接检查失败，尝试重连:', error);
    try {
      // 断开旧连接
      await prisma.$disconnect();
      // 重新连接
      await prisma.$connect();
      console.log('✅ 数据库重连成功');
    } catch (reconnectError) {
      console.error('❌ 数据库重连失败:', reconnectError);
      throw reconnectError;
    }
  }
}

// 包装 Prisma 查询，自动处理连接问题
export async function withRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 每次查询前确保连接正常
      await ensureConnection();
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // 如果是连接相关错误，尝试重连
      if (
        error?.code === 'P1001' || // 无法连接到数据库服务器
        error?.code === 'P1008' || // 操作超时
        error?.code === 'P1017' || // 服务器关闭了连接
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout')
      ) {
        console.warn(`数据库连接错误 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message);
        
        if (attempt < maxRetries) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
      
      // 非连接错误或重试次数用完，直接抛出
      throw error;
    }
  }
  
  throw lastError;
}

// 优雅关闭：应用退出时断开数据库连接
if (typeof process !== 'undefined') {
  const gracefulShutdown = async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ Prisma 客户端已断开连接');
    } catch (error) {
      console.error('❌ 断开 Prisma 连接时出错:', error);
    }
  };

  process.on('beforeExit', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}
