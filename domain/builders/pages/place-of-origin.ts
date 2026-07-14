import { faker } from '@faker-js/faker';
import { cannedPlaceOfOrigins } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function placeOfOrigin(draft: Notification): void {
  draft.placeOfOrigin = structuredClone(faker.helpers.arrayElement(cannedPlaceOfOrigins));
}
