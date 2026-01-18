'use client';

import { useEffect, useState } from 'react';

interface Store {
  shopName: string;
  price: number;
  affiliateLink: string;
}

interface StoreListProps {
  setNumber: string;
  initialStores?: Store[];
}

export default function StoreList({ setNumber, initialStores = [] }: StoreListProps) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [loading, setLoading] = useState(false);

  // 如果传入了初始数据，直接使用
  useEffect(() => {
    if (initialStores.length > 0) {
      setStores(initialStores);
    }
  }, [initialStores]);

  // 暴露更新方法供父组件调用
  useEffect(() => {
    // 将更新方法挂载到 window 对象，供 RefreshPriceButton 调用
    (window as any)[`updateStores_${setNumber}`] = (newStores: Store[]) => {
      setStores(newStores);
    };
    
    return () => {
      delete (window as any)[`updateStores_${setNumber}`];
    };
  }, [setNumber]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-lg font-medium">暂无店铺信息</p>
        <p className="text-sm mt-2">点击"更新价格"按钮获取最新店铺信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {stores.map((store, index) => (
        <div
          key={index}
          className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
        >
          {/* 编号 */}
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
            {index + 1}
          </div>
          
          {/* 店铺信息 */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">{store.shopName}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">价格: <span className="text-blue-600 font-semibold">¥{store.price.toFixed(2)}</span></div>
          </div>
          
          {/* 购买按钮 */}
          <a
            href={store.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
          >
            购买
          </a>
        </div>
      ))}
    </div>
  );
}
