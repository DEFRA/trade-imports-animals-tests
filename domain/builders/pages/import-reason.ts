import { faker } from '@faker-js/faker';
import { importReasons } from '@domain/constants/import-reasons';
import type { Notification } from '@domain/models/api/notification';

export function importReason(draft: Notification): void {
  draft.reasonForImport = faker.helpers.objectValue(importReasons);
}
