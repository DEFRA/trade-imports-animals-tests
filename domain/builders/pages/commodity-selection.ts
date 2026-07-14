import { faker } from '@faker-js/faker';
import { commodityCodes } from '@domain/constants/commodity-codes';
import type { Notification } from '@domain/models/api/notification';

export function commoditySelection(draft: Notification): void {
  draft.commodity = { name: faker.helpers.objectValue(commodityCodes) };
}
