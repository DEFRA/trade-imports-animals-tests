import { resolveObligationIds } from '../manifests.js';
import type { Scenario } from './index.js';

const GHOST_ADDRESS_ID = 'eudpa-573-ghost-address-abcdef';

// Party fulfilments the trader can pick from address-book. Any of these that
// exist on the notification is rewritten to a ghost id.
const PARTY_NAMES = ['consignor', 'contactAddress', 'placeOfDestination', 'consignee', 'importer', 'placeOfOrigin'];

/**
 * Simulate an address-book party that has been deleted between submit and
 * amend. Rather than deleting the record in the address-book service (which
 * would need a second connection), rewrite every party fulfilment on the
 * notification to point at an addressId that address-book will not resolve.
 * The frontend's live lookup returns null; the sanitiser drops the reference
 * from `answers`; CYA renders "Not provided" plus an outstanding-party error;
 * the dashboard row still shows the summary name extracted at submit; the hub
 * row still shows the section as Completed. Three surfaces disagree.
 */
export const partyDeleted: Scenario = {
  id: 'party-deleted',
  summary: 'Repoint every party fulfilment at an addressId the address-book service does not hold',
  applies: ['animals', 'plants'],
  mutate: async ({ notifications, referenceNumber, frontend }) => {
    const doc = await notifications.findOne({ referenceNumber });
    if (!doc) {
      throw new Error(`Notification ${referenceNumber} not found in the notifications collection.`);
    }
    const partyIdToName = await resolveObligationIds(frontend, PARTY_NAMES);
    const fulfilments = (doc.fulfilments ?? []) as Array<{ obligationId: string; value?: unknown; records?: unknown }>;
    const partyEntries = fulfilments.filter(
      (entry) =>
        partyIdToName.has(entry.obligationId) &&
        entry.value &&
        typeof entry.value === 'object' &&
        'addressId' in (entry.value as Record<string, unknown>),
    );
    if (partyEntries.length === 0) {
      throw new Error(
        `Notification ${referenceNumber} carries no party fulfilments with an addressId — the trader may not have reached the parties section before submitting.`,
      );
    }
    for (const entry of partyEntries) {
      await notifications.updateOne(
        { referenceNumber, 'fulfilments.obligationId': entry.obligationId },
        { $set: { 'fulfilments.$.value': { addressId: GHOST_ADDRESS_ID } } },
      );
    }
    const rewrittenNames = partyEntries.map((e) => partyIdToName.get(e.obligationId));
    console.log(`  → rewrote ${partyEntries.length} party fulfilment(s): ${rewrittenNames.join(', ')}`);
  },
};
