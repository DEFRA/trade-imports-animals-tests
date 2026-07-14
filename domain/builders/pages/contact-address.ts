import { faker } from '@faker-js/faker';
import { cannedContacts } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function contactAddress(draft: Notification): void {
  draft.consignment = structuredClone(faker.helpers.arrayElement(cannedContacts));
}
