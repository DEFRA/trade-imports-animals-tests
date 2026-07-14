import { faker } from '@faker-js/faker';
import { cannedConsignees } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function consignee(draft: Notification): void {
  draft.consignee = structuredClone(faker.helpers.arrayElement(cannedConsignees));
}
