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
  
  // 连接池稍小一点，减少长时间空闲后被服务端关闭的连接数；超时与重试由 withRetry 处理
  const urlWithParams = url.includes('?')
    ? `${url}&connection_limit=5&pool_timeout=30&connect_timeout=15`
    : `${url}?connection_limit=5&pool_timeout=30&connect_timeout=15`;

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

// 判断是否为连接相关错误（包括空闲连接被关闭、网络断开等）
function isConnectionError(error: any): boolean {
  const msg = (error?.message ?? '').toLowerCase();
  const code = error?.code ?? '';
  return (
    // Prisma 错误码
    code === 'P1001' || // 无法连接到数据库服务器
    code === 'P1008' || // 操作超时
    code === 'P1017' || // 服务器关闭了连接
    code === 'P1010' || // 用户、密码或数据库名无效
    code === 'P1012' || // 连接字符串无效
    // 常见连接/网络错误
    msg.includes('connection') ||
    msg.includes('timeout') ||
    msg.includes('authentication failed') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('connection terminated') ||
    msg.includes('connection closed') ||
    msg.includes('connection refused') ||
    msg.includes('socket hang up') ||
    msg.includes('read econnreset') ||
    msg.includes('write econnreset') ||
    msg.includes('broken pipe') ||
    msg.includes('prismaclient') ||
    msg.includes('invalid `prisma.') ||
    error?.name === 'PrismaClientInitializationError' ||
    error?.name === 'PrismaClientKnownRequestError'
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

// 包装 Prisma 查询：空闲连接断开后自动重连，无需重建数据库或重新上传数据
export async function withRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 执行查询（Prisma 会自动连接）
      return await queryFn();
    } catch (error: any) {
      lastError = error;

      // 任何可能是“连接断开/过期”的错误都先尝试断开再重试
      if (isConnectionError(error)) {
        console.warn(
          `[DB] 连接异常 (${attempt + 1}/${maxRetries + 1})，尝试重连:`,
          error?.message?.slice(0, 80) || error?.code
        );

        if (attempt < maxRetries) {
          try {
            await prisma.$disconnect().catch(() => {});
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            await prisma.$connect();
            continue; // 重试 queryFn
          } catch (reconnectErr: any) {
            console.error('[DB] 重连失败:', reconnectErr?.message || reconnectErr);
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
              continue;
            }
          }
        }
      }

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
