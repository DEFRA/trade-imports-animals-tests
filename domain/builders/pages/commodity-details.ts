import { faker } from '@faker-js/faker';
import type { Notification } from '@domain/models/api/notification';

/**
 * Per-species counts stay strings (raw form input values); only the totals
 * are numbers, matching the frontend's getTotal aggregation.
 */
export function commodityDetails(draft: Notification): void {
  const complement = draft.commodity?.commodityComplement?.[0];
  if (!complement) {
    throw new Error('commodity-details requires species-selection to have run first');
  }
  const counts = complement.species.map(() => ({
    animals: faker.number.int({ min: 1, max: 50 }),
    packages: faker.number.int({ min: 1, max: 50 }),
  }));

  complement.species = complement.species.map((species, index) => ({
    ...species,
    noOfAnimals: String(counts[index].animals),
    noOfPackages: String(counts[index].packages),
  }));
  complement.totalNoOfAnimals = counts.reduce((total, count) => total + count.animals, 0);
  complement.totalNoOfPackages = counts.reduce((total, count) => total + count.packages, 0);
}
