export const SET_BASES = {
  liveAnimals: '/live-animals',
  plantProducts: '/plant-products',
} as const;

export type SetBase = (typeof SET_BASES)[keyof typeof SET_BASES];
