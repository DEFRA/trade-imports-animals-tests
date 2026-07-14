import { faker } from '@faker-js/faker';
import { cannedConsignors } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function consignor(draft: Notification): void {
  draft.consignor = structuredClone(faker.helpers.arrayElement(cannedConsignors));
}
