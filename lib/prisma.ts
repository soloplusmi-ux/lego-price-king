import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPromise: Promise<PrismaClient> | undefined;
};

// 确保 DATABASE_URL 存在
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL 环境变量未设置！请检查 .env 文件或 docker-compose.yml');
  console.error('当前环境变量:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')).join(', '));
}

// 创建 Prisma 客户端，配置连接池和重试机制
function createPrismaClient(): PrismaClient {
  // 解析 DATABASE_URL，添加连接池参数
  const url = databaseUrl || '';
  
  // 如果 URL 中已有参数，追加；否则添加
  const urlWithParams = url.includes('?')
    ? `${url}&connection_limit=10&pool_timeout=20&connect_timeout=10`
    : `${url}?connection_limit=10&pool_timeout=20&connect_timeout=10`;

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: urlWithParams,
      },
    },
    // 添加错误格式化，便于调试
    errorFormat: 'pretty',
  });

  // 延迟连接：不立即连接，而是在首次使用时连接
  // 这样可以避免在模块加载时就失败
  return client;
}

// 初始化 Prisma 客户端（延迟连接）
function initPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  
  return client;
}

export const prisma = initPrisma();

// 确保连接的辅助函数
let connectionPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  // 如果已经有连接检查在进行，等待它完成
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      // 尝试连接（Prisma 会在首次查询时自动连接，但我们可以显式连接）
      await prisma.$connect();
    } catch (error: any) {
      console.error('❌ Prisma 连接失败:', {
        code: error?.code,
        message: error?.message,
        meta: error?.meta,
      });
      
      // 如果是连接错误，提供更详细的诊断信息
      if (error?.code === 'P1001' || error?.message?.includes('connect')) {
        console.error('数据库连接问题诊断:');
        console.error('- DATABASE_URL:', databaseUrl ? '已设置' : '未设置');
        console.error('- 数据库主机: postgres:5432');
        console.error('- 请检查: 1) 数据库服务是否运行 2) 密码是否正确 3) 网络是否正常');
      }
      
      throw error;
    }
  })();

  try {
    await connectionPromise;
  } finally {
    connectionPromise = null;
  }
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
      // 确保连接已建立
      await ensureConnected();
      
      // 执行查询
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // 检查是否是 Prisma 初始化错误
      if (error?.name === 'PrismaClientInitializationError' || error?.message?.includes('PrismaClient')) {
        console.error(`❌ Prisma 客户端初始化错误 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error.message);
        
        if (attempt < maxRetries) {
          // 重置连接
          try {
            await prisma.$disconnect().catch(() => {});
            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
            continue;
          } catch (resetError) {
            console.error('重置连接失败:', resetError);
          }
        }
      }
      
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
