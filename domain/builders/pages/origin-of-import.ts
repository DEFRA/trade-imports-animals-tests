import { faker } from '@faker-js/faker';
import type { Notification } from '@domain/models/api/notification';
import type { PageDataContext } from '@domain/builders/page-data-context';

export function originOfImport(draft: Notification, ctx: PageDataContext): void {
  draft.origin = {
    countryCode: faker.helpers.arrayElement(ctx.countries).code,
    requiresRegionCode: 'no',
    internalReference: faker.string.alphanumeric({ length: 12 }),
  };
}
