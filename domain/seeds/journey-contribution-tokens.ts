import type { PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';
import { ARRIVAL_DATE } from '@domain/constants/journey-options';
import type { DateInput } from '@domain/types/date-time-input';

/**
 * What one journey page adds. The frontend writes both halves on every save
 * (`records/real/lifecycle/mutate.js`), so a seed carrying only the fulfilments
 * leaves the document empty — and everything the backend reads comes from there.
 */
export type JourneyContribution = {
  notification: Record<string, unknown>;
  fulfilments: PersistedFulfilmentEntry[];
};

/**
 * The values a recording cannot carry literally: address-book ids are minted per
 * environment, and the arrival date has to stay inside the app's arrival window.
 * The recorder writes tokens; the seeder resolves them where it is seeding.
 */
export const ARRIVAL_DATE_TOKEN = '{{arrivalDate}}';
export const ARRIVAL_DATE_ISO_TOKEN = '{{arrivalDateIso}}';
export const addressBookToken = (name: string): string => `{{addressBook:${name}}}`;

const ADDRESS_BOOK_TOKEN = /^\{\{addressBook:(.+)\}\}$/;
const ADDRESS_BOOK_TOKENS = /\{\{addressBook:(.+?)\}\}/g;

/** The arrival date in each of the two shapes it is stored in. */
export const arrivalDateValue = (): DateInput => {
  const [day, month, year] = ARRIVAL_DATE.split('/');
  return { day, month, year };
};

export const arrivalDateIso = (): string => {
  const { day, month, year } = arrivalDateValue();
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const addressBookNamesIn = (contributions: JourneyContribution[]): string[] => [
  ...new Set([...JSON.stringify(contributions).matchAll(ADDRESS_BOOK_TOKENS)].map(([, name]) => name)),
];

export const resolveTokens = (value: unknown, addressIds: Map<string, string>): unknown => {
  if (typeof value === 'string') {
    if (value === ARRIVAL_DATE_TOKEN) return arrivalDateValue();
    if (value === ARRIVAL_DATE_ISO_TOKEN) return arrivalDateIso();
    const [, name] = ADDRESS_BOOK_TOKEN.exec(value) ?? [];
    if (!name) return value;
    // An unresolved name would seed `addressId: undefined`, which serialises
    // away — leaving a notification with no party and nothing to notice it.
    const addressId = addressIds.get(name);
    if (!addressId) {
      throw new Error(`No address-book record for "${name}" — seeding would drop the party reference`);
    }
    return addressId;
  }
  if (Array.isArray(value)) return value.map((item) => resolveTokens(item, addressIds));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveTokens(item, addressIds)]));
  }
  return value;
};
