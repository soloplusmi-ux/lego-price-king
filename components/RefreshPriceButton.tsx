'use client';

import { useState } from 'react';

interface Store {
  shopName: string;
  price: number;
  affiliateLink: string;
}

interface RefreshPriceButtonProps {
  setNumber: string;
  onStoresUpdate?: (stores: Store[]) => void;
  onPriceUpdate?: (medianPrice: number) => void;
}

export default function RefreshPriceButton({ setNumber, onStoresUpdate, onPriceUpdate }: RefreshPriceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mockHint, setMockHint] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setMessage(null);
    setMockHint(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      const url = `/api/refresh-prices?setNumber=${encodeURIComponent(setNumber)}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`价格已更新: ¥${data.medianPrice?.toFixed(2) || 'N/A'}`);
        if (data.source === 'mock' && data.mockReason) {
          setMockHint(data.mockReason);
        }
        if (typeof data.medianPrice === 'number' && onPriceUpdate) {
          onPriceUpdate(data.medianPrice);
        }
        // 如果有店铺数据，通知 StoreList 更新（不再 reload，避免店铺列表被清空）
        if (data.stores && Array.isArray(data.stores) && data.stores.length > 0) {
          const updateFn = (window as any)[`updateStores_${setNumber}`];
          if (updateFn) updateFn(data.stores);
          if (onStoresUpdate) onStoresUpdate(data.stores);
        }
      } else {
        setMessage(data.error || '更新失败');
      }
    } catch (error) {
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full sm:w-auto">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="w-full sm:w-auto bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="hidden sm:inline">更新中...</span>
            <span className="sm:hidden">更新中</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">更新价格</span>
            <span className="sm:hidden">更新</span>
          </>
        )}
      </button>
      {message && (
        <p className={`mt-2 text-xs sm:text-sm text-center sm:text-left ${message.includes('失败') || message.includes('错误') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
      {mockHint && (
        <div className="mt-1 text-xs text-amber-600 text-center sm:text-left max-w-md space-y-1">
          <p>⚠ 当前为模拟数据。{mockHint}</p>
          {mockHint.includes('Insufficient isv permissions') || mockHint.includes('11 ') ? (
            <p className="text-amber-700">
              需在淘宝开放平台为应用申请「淘宝客-推广者-物料搜索」等 API 权限，通过审核后即可获取真实价格。详见项目内 TAOBAO_SETUP_GUIDE.md。
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
