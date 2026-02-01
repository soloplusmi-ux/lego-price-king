import { Prisma } from '@prisma/client';

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

/**
 * 安全地将 Prisma Json 类型转换为 PriceHistoryPoint[]
 * 这个方法可以安全地处理所有类型转换问题
 */
export function parsePriceHistory(jsonValue: Prisma.JsonValue | null): PriceHistoryPoint[] {
  // 如果为空或 null，返回空数组
  if (!jsonValue) {
    return [];
  }
  
  // 如果不是对象或不是数组，返回空数组
  if (typeof jsonValue !== 'object' || !Array.isArray(jsonValue)) {
    return [];
  }
  
  // 遍历数组，验证并转换每个元素
  const result: PriceHistoryPoint[] = [];
  for (const item of jsonValue) {
    // 检查 item 是否是对象，并且有 date 和 price 属性
    if (
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      'date' in item &&
      'price' in item
    ) {
      const dateValue = (item as any).date;
      const priceValue = (item as any).price;
      
      // 验证类型并转换（price 可能是 number 或 JSON 中的字符串如 "305.00"）
      if (typeof dateValue !== 'string') continue;
      const priceNum = typeof priceValue === 'number' ? priceValue : parseFloat(String(priceValue));
      if (!Number.isNaN(priceNum)) {
        result.push({ date: dateValue, price: priceNum });
      }
    }
  }
  
  return result;
}
