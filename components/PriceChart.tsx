'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface PriceChartProps {
  data: PriceHistoryPoint[];
}

export default function PriceChart({ data }: PriceChartProps) {
  // 格式化日期显示
  const formattedData = data.map(item => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
            width={50}
            label={{ value: '价格 (¥)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' } }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`¥${value.toFixed(2)}`, '价格']}
            labelFormatter={(label) => `日期: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ r: 4, fill: '#2563eb' }}
            activeDot={{ r: 6, fill: '#1d4ed8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
