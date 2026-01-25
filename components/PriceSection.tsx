'use client';

import { useState } from 'react';
import RefreshPriceButton from './RefreshPriceButton';

interface PriceSectionProps {
  setNumber: string;
  initialLastPrice: number | null;
}

export default function PriceSection({ setNumber, initialLastPrice }: PriceSectionProps) {
  const [displayPrice, setDisplayPrice] = useState<number | null>(initialLastPrice);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex-1">
        <div className="text-xs sm:text-sm text-gray-500 mb-1">淘宝信价中位数</div>
        {displayPrice !== null ? (
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            ¥{displayPrice.toFixed(2)}
          </div>
        ) : (
          <div className="text-base sm:text-lg text-gray-400">暂无价格数据</div>
        )}
      </div>
      <div className="flex-shrink-0">
        <RefreshPriceButton setNumber={setNumber} onPriceUpdate={setDisplayPrice} />
      </div>
    </div>
  );
}
