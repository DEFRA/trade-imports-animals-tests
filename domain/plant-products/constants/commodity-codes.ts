export const commodityCodes = {
  hyacinths: { value: '06011010', display: 'Hyacinths' },
  otherCutFlowers: { value: '0603197090', display: 'Other' },
  otherFoliage: { value: '06042090', display: 'Other' },
  beansForSowing: { value: '0713500010', display: 'For sowing' },
  otherCitrus: { value: '08059000', display: 'Other' },
  ciderApples: { value: '0808108010', display: 'Cider apples' },
  otherApples: { value: '0808108090', display: 'Other' },
  turmeric: { value: '09103000', display: 'Turmeric (curcuma)' },
  canarySeed: { value: '10083000', display: 'Canary seed' },
  otherVegetableProducts: { value: '14019000', display: 'Other' },
  ploughs: { value: '84321000', display: 'Ploughs' },
  agriculturalTractors: {
    value: '87019510',
    display: 'Agricultural tractors and forestry tractors, wheeled',
  },
} as const;

export type CommodityCode = (typeof commodityCodes)[keyof typeof commodityCodes];
