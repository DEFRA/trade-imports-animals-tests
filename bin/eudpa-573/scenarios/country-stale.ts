import { resolveObligationId } from '../manifests.js';
import type { Scenario } from './index.js';

// A code that is definitely not in the seeded MDM stub. Two Zs feel obviously
// bogus in the demo audience's field.
const STALE_CODE = 'ZZ';

/**
 * Simulate a reference-data re-release that dropped the trader's stored country
 * code between submit and amend. The persisted fulfilment for
 * `countryOfOrigin` is rewritten to a code the current origin block does not
 * offer.
 *
 * The frontend re-reads the fulfilment on Amend, so the mutation is picked up
 * the next time the dashboard loads. No frontend restart required.
 */
export const countryStale: Scenario = {
  id: 'country-stale',
  summary: 'Rewrite the stored countryOfOrigin to a code the current origin block no longer offers',
  applies: ['animals', 'plants'],
  mutate: async ({ notifications, referenceNumber, frontend }) => {
    const obligationId = await resolveObligationId(frontend, 'countryOfOrigin');
    const result = await notifications.updateOne(
      { referenceNumber, 'fulfilments.obligationId': obligationId },
      { $set: { 'fulfilments.$.value': STALE_CODE } },
    );
    if (result.matchedCount === 0) {
      throw new Error(
        `Notification ${referenceNumber} has no countryOfOrigin fulfilment to rewrite — the trader may not have reached the origin page before submitting.`,
      );
    }
  },
};
