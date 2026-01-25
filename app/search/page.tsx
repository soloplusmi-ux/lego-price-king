import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';

const prisma = new PrismaClient();

// 避免搜索页被缓存，确保每次都查库
export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: { q?: string };
}

async function getSearchResults(query: string) {
  const term = (query || '').trim();
  if (term === '') {
    // 无关键词时：返回最近录入的 24 条，便于确认有数据
    return await prisma.legoSet.findMany({
      take: 24,
      orderBy: { createdAt: 'desc' },
    });
  }

  return await prisma.legoSet.findMany({
    where: {
      OR: [
        { setNumber: { contains: term, mode: 'insensitive' } },
        { name: { contains: term, mode: 'insensitive' } },
        { theme: { contains: term, mode: 'insensitive' } },
      ],
    },
    take: 50,
    orderBy: { year: 'desc' },
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const results = await getSearchResults(query);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700">
            乐高比价王
          </Link>
        </header>

        {/* Search Bar */}
        <div className="max-w-2xl mb-8">
          <form action="/search" method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="搜索乐高套装..."
              className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              搜索
            </button>
          </form>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            {query.trim() ? `搜索结果: ${query} (${results.length} 个)` : `最近录入 (${results.length} 个)`}
          </h2>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">未找到相关结果，请换个关键词试试</p>
            </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((set) => (
                  <Link
                    key={set.setNumber}
                    href={`/set/${set.setNumber}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="aspect-square relative bg-gray-100">
                      {set.imageUrl ? (
                        <Image
                          src={set.imageUrl}
                          alt={set.name}
                          fill
                          className="object-cover"
                          unoptimized={set.imageUrl.startsWith('/images/')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          暂无图片
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{set.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {set.setNumber} · {set.theme}
                      </p>
                      {set.lastPrice && (
                        <p className="text-blue-600 font-bold">
                          ¥{set.lastPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
