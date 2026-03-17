export const commodityCodes = {
  cat: 'Cat',
  dog: 'Dog',
  fish: 'Fish',
} as const;

export type CommodityCode = (typeof commodityCodes)[keyof typeof commodityCodes];
