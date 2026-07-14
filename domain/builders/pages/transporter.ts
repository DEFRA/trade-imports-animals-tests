import { faker } from '@faker-js/faker';
import { cannedTransporters } from '@domain/builders/canned-data';
import type { Notification } from '@domain/models/api/notification';

export function transporter(draft: Notification): void {
  draft.transport = {
    ...draft.transport,
    transporter: structuredClone(faker.helpers.arrayElement(cannedTransporters)),
  };
}
