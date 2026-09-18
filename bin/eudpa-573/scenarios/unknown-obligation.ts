import type { Scenario } from './index.js';

const GHOST_OBLIGATION_ID = 'eudpa-573-ghost-obligation-abcdef';

/**
 * Simulate an obligation that has been removed from the manifest since the
 * notification was submitted. A fulfilment entry keyed on an id the current
 * manifest doesn't know is added to the doc. On the next evaluate the engine's
 * `dropUnrecognisedFulfilments` sweeps it out, silently. The dashboard row
 * still names the summary fields it extracted at submit time, but the amend
 * journey no longer knows the ghost answer exists.
 */
export const unknownObligation: Scenario = {
  id: 'unknown-obligation',
  summary: 'Add a fulfilment for an obligation id the current manifest does not know — engine drops it silently on read',
  applies: ['animals', 'plants'],
  mutate: async ({ notifications, referenceNumber }) => {
    const ghostFulfilment = { obligationId: GHOST_OBLIGATION_ID, value: 'the-answer-that-nobody-will-ever-see' };
    // The collection is typed as an opaque Document (see MongoDbClient), so the
    // driver's stricter $push signature has to be widened for the field name.
    const result = await notifications.updateOne({ referenceNumber }, { $push: { fulfilments: ghostFulfilment } as never });
    if (result.matchedCount === 0) {
      throw new Error(`Notification ${referenceNumber} not found in the notifications collection.`);
    }
  },
};
