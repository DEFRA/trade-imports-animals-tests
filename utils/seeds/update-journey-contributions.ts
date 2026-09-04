import { writeFile } from 'node:fs/promises';
import { test } from '@fixtures';
import { captureContributions } from '@utils/seeds/journey-capture';
import type { JourneyContribution } from '@domain/seeds/journey-contribution-tokens';

/**
 * Regenerates `domain/seeds/journey-contributions.ts` from what a real UI journey
 * writes. Run it whenever the frontend's obligations or mapper change —
 * `contributions:check` fails until you do.
 */
const OUT_FILE = 'domain/seeds/journey-contributions.ts';

const sourceOf = (contributions: Record<string, JourneyContribution>): string =>
  [
    '// GENERATED FILE — do not edit by hand.',
    '// Recorded from a real UI journey by utils/seeds/update-journey-contributions.ts;',
    '// re-run it with `npm run contributions:update` when the frontend obligations or mapper change.',
    "import type { PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';",
    '',
    '/** What each journey page adds to a notification, in journey order. */',
    'export const journeyContributions: Record<string, { notification: Record<string, unknown>; fulfilments: PersistedFulfilmentEntry[] }> =',
    `  ${JSON.stringify(contributions, null, 2)};`,
    '',
  ].join('\n');

test.describe('Journey contributions', () => {
  test('regenerates from what each journey page writes', async ({ journey, journeyContext, addressBookApi }) => {
    test.slow();
    const contributions = await captureContributions({ journey, journeyContext, addressBookApi });

    for (const [page, contribution] of Object.entries(contributions)) {
      console.log(`${page}: +${Object.keys(contribution.notification).length} fields, +${contribution.fulfilments.length} entries`);
    }

    await writeFile(OUT_FILE, sourceOf(contributions));
  });
});
