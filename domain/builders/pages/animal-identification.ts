import { faker } from '@faker-js/faker';
import type { Notification } from '@domain/models/api/notification';

export function animalIdentification(draft: Notification): void {
  const prefix = draft.origin?.countryCode ?? 'FR';
  const complement = draft.commodity?.commodityComplement?.[0];
  if (!complement) {
    throw new Error('animal-identification requires species-selection to have run first');
  }

  complement.species = complement.species.map((species) => ({
    ...species,
    earTag: `${prefix}${faker.string.numeric(12)}`,
    passport: `${prefix}-BOV-2024-${faker.string.numeric(6)}`,
  }));
}
