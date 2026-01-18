import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            乐高比价王
          </h1>
          <p className="text-xl text-gray-600">
            Lego Price King - 找到最优惠的乐高套装价格
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <form action="/search" method="get">
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="搜索乐高套装编号或名称..."
                className="w-full px-6 py-4 pl-14 text-lg border-2 border-blue-300 rounded-full focus:outline-none focus:border-blue-500 shadow-lg"
              />
              <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">智能搜索</h3>
            <p className="text-gray-600">
              快速找到您想要的乐高套装
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">价格追踪</h3>
            <p className="text-gray-600">
              实时追踪价格变化历史
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">比价功能</h3>
            <p className="text-gray-600">
              对比多个平台的最优价格
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
