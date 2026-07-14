import { faker } from '@faker-js/faker';
import { pointOfEntries } from '@domain/constants/point-of-entries';
import { getRelativeDateInput } from '@utils/date-utils';
import type { Notification } from '@domain/models/api/notification';

/**
 * Port options are the frontend's hardcoded select values, not reference-data
 * codes — the reference-data ports integration has not merged to main yet.
 */
export function portOfEntry(draft: Notification): void {
  const arrival = getRelativeDateInput({ dayOffset: faker.number.int({ min: 3, max: 30 }) });
  draft.transport = {
    ...draft.transport,
    portOfEntry: faker.helpers.objectValue(pointOfEntries),
    arrivalDate: `${arrival.year}-${arrival.month}-${arrival.day}`,
  };
}
