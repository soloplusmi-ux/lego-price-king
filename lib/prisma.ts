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

// 判断是否为连接相关错误
function isConnectionError(error: any): boolean {
  return (
    error?.code === 'P1001' || // 无法连接到数据库服务器
    error?.code === 'P1008' || // 操作超时
    error?.code === 'P1017' || // 服务器关闭了连接
    error?.code === 'P1010' || // 用户、密码或数据库名无效
    error?.message?.includes('connection') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('Authentication failed') ||
    error?.message?.includes('ECONNREFUSED') ||
    error?.message?.includes('connect ECONNREFUSED')
  );
}

// 尝试重连数据库
async function reconnectDatabase(): Promise<void> {
  try {
    console.log('尝试重连数据库...');
    // 断开旧连接（忽略错误）
    await prisma.$disconnect().catch(() => {});
    // 重新连接
    await prisma.$connect();
    console.log('✅ 数据库重连成功');
  } catch (reconnectError: any) {
    console.error('❌ 数据库重连失败:', reconnectError?.message || reconnectError);
    throw reconnectError;
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
      // 直接执行查询，如果失败再处理
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // 如果是连接相关错误，尝试重连后重试
      if (isConnectionError(error)) {
        console.warn(`数据库连接错误 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message || error.code);
        
        if (attempt < maxRetries) {
          try {
            // 尝试重连
            await reconnectDatabase();
            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          } catch (reconnectError) {
            // 重连失败，继续重试循环
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
          }
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
