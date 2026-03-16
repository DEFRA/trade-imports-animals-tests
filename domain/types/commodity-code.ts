export const commodityCode = {
  cat: 'cat',
  dog: 'dog',
  fish: 'fish',
} as const;

export type CommodityCode = (typeof commodityCode)[keyof typeof commodityCode];
