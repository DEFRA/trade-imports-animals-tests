import { faker } from '@faker-js/faker';
import { cannedImporters } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function importer(draft: Notification): void {
  draft.importer = structuredClone(faker.helpers.arrayElement(cannedImporters));
}
