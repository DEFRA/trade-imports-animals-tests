import type { Collection, Document } from 'mongodb';

/** Every scenario shares this signature: the notification's Mongo document is
 * already in `notifications` under `referenceNumber`. Mutate it in place. */
export type Mutation = (params: { notifications: Collection<Document>; referenceNumber: string; frontend: Frontend }) => Promise<void>;

export type Frontend = 'animals' | 'plants';

export type Scenario = {
  id: string;
  summary: string;
  applies: readonly Frontend[];
  mutate: Mutation;
};

import { countryStale } from './country-stale.js';
import { unknownObligation } from './unknown-obligation.js';
import { partyDeleted } from './party-deleted.js';

export const SCENARIOS: Record<string, Scenario> = {
  [countryStale.id]: countryStale,
  [unknownObligation.id]: unknownObligation,
  [partyDeleted.id]: partyDeleted,
};
