import { faker } from '@faker-js/faker';
import { cannedCommodityTypes, cannedSpeciesOptions } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function speciesSelection(draft: Notification): void {
  const commodity = draft.commodity;
  if (!commodity) {
    throw new Error('species-selection requires commodity-selection to have run first');
  }

  const selected = faker.helpers
    .arrayElements(cannedSpeciesOptions, { min: 1, max: 2 })
    .sort((a, b) => cannedSpeciesOptions.indexOf(a) - cannedSpeciesOptions.indexOf(b));

  commodity.commodityComplement = [
    {
      typeOfCommodity: cannedCommodityTypes[0],
      species: selected.map(({ value, text }) => ({ value, text })),
    },
  ];
}
