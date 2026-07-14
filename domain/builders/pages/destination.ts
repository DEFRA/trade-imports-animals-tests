import { faker } from '@faker-js/faker';
import { cannedDestinations } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function destination(draft: Notification): void {
  draft.destination = structuredClone(faker.helpers.arrayElement(cannedDestinations));
}
