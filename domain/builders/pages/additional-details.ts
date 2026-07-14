import { faker } from '@faker-js/faker';
import { certificationPurposes } from '@domain/constants/certification-purposes';
import type { Notification } from '@domain/models/api/notification';

export function additionalDetails(draft: Notification): void {
  draft.additionalDetails = {
    certifiedFor: faker.helpers.objectValue(certificationPurposes),
    unweanedAnimals: 'no',
  };
}
