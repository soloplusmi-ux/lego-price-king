import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PriceChart from '@/components/PriceChart';
import StoreList from '@/components/StoreList';
import RefreshPriceButton from '@/components/RefreshPriceButton';
import { parsePriceHistory } from '@/lib/priceHistory';

const prisma = new PrismaClient();

async function getLegoSet(setNumber: string) {
  const set = await prisma.legoSet.findUnique({
    where: { setNumber },
  });

  if (!set) {
    return null;
  }

  return set;
}

export default async function SetDetailPage({
  params,
}: {
  params: { setNumber: string };
}) {
  const set = await getLegoSet(params.setNumber);

  if (!set) {
    notFound();
  }

  const priceHistory = parsePriceHistory(set.priceHistory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 顶部返回按钮 */}
        <header className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-lg text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>
        </header>

        {/* 产品主信息区 */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          {/* 产品图片 - 居中显示 */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              {set.imageUrl ? (
                <Image
                  src={set.imageUrl}
                  alt={set.name}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-base sm:text-lg">
                  暂无图片
                </div>
              )}
            </div>
          </div>

          {/* 基本信息 - 左右布局 */}
          <div className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* 左侧信息 */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base">编号:</span>
                  <span className="text-gray-900 text-sm sm:text-base break-all">{set.setNumber}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base">名称:</span>
                  <span className="text-gray-900 text-base sm:text-lg font-medium break-words">{set.name}</span>
                </div>
                {set.minifigs !== null && (
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base">人仔数:</span>
                    <span className="text-gray-900 text-sm sm:text-base">{set.minifigs}</span>
                  </div>
                )}
              </div>

              {/* 右侧信息 */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base">主题:</span>
                  <span className="text-gray-900 text-sm sm:text-base break-words">{set.theme}</span>
                </div>
                {set.subTheme && (
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base">子主题:</span>
                    <span className="text-gray-900 text-sm sm:text-base break-words">{set.subTheme}</span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[70px] sm:min-w-[80px] text-sm sm:text-base">年份:</span>
                  <span className="text-gray-900 text-sm sm:text-base">{set.year}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 价格信息区 */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">淘宝信价中位数</div>
                {set.lastPrice !== null ? (
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    ¥{set.lastPrice.toFixed(2)}
                  </div>
                ) : (
                  <div className="text-base sm:text-lg text-gray-400">暂无价格数据</div>
                )}
              </div>
              <div className="flex-shrink-0">
                <RefreshPriceButton setNumber={set.setNumber} />
              </div>
            </div>
          </div>
        </div>

        {/* 价格历史图表区 */}
        {priceHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">价格历史</h2>
              <div className="bg-gray-50 rounded-lg p-2 sm:p-4 overflow-x-auto">
                <PriceChart data={priceHistory} />
              </div>
            </div>
          </div>
        )}

        {/* 商店列表区 */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">购买渠道 (Top 15)</h2>
            <StoreList setNumber={set.setNumber} />
          </div>
        </div>
      </div>
    </div>
  );
}
