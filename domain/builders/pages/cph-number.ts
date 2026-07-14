import { faker } from '@faker-js/faker';
import type { Notification } from '@domain/models/api/notification';

/** The frontend strips slashes before saving, so the stored CPH is 9 digits. */
export function cphNumber(draft: Notification): void {
  draft.cphNumber = faker.string.numeric({ length: 9, allowLeadingZeros: false });
}
