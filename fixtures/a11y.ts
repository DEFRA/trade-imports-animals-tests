import { test as base, expect } from '@fixtures';
import { scanPage, formatSummaries, type A11yScanOptions, type ViolationSummary } from '@utils/a11y-utils';

/**
 * Couples the WCAG 2.2 AA name with axe's tags so describe titles and the
 * ruleset can't drift apart. Tags are discrete filters — all five are needed
 * for AA — and axe only automates part of the standard (only 2.5.8 Target
 * Size among the new 2.2 criteria), so a pass isn't full conformance.
 */
export const WCAG_STANDARD = {
  name: 'WCAG 2.2 AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
} as const;

// Accessibility tests click through several pages and run axe scans on
// each, so they need more headroom than the default per-test timeout.
const A11Y_SCAN_TIMEOUT_MS = 5 * 60 * 1000;

export interface A11yFixtures {
  runA11yScan: (options?: A11yScanOptions) => Promise<void>;
}

export const test = base.extend<A11yFixtures>({
  runA11yScan: async ({ page }, use, testInfo) => {
    // Before test: initialise results collection
    const results: ViolationSummary[] = [];

    // During test: scan the page
    await use(async (options) => {
      const summary = await scanPage(page, { ...options, tags: options?.tags ?? [...WCAG_STANDARD.tags] });
      results.push(summary);
    });

    // After test: guard against tests that destructure runA11yScan but never call it
    if (results.length === 0) throw new Error('No accessibility scans were run. Call runA11yScan() at least once.');

    // After test: attach a JSON artefact for each scan that found violations
    for (const { path, violations } of results) {
      if (violations.length > 0) {
        await testInfo.attach(`accessibility-violations: ${path}`, {
          body: JSON.stringify(violations, null, 2),
          contentType: 'application/json',
        });
      }
    }

    // After test: throw a combined error if any scan had violations
    const message = formatSummaries(results);
    if (message) throw new Error(message);
  },
});

// Playwright requires the first hook arg to be a destructuring pattern.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, testInfo) => {
  testInfo.setTimeout(A11Y_SCAN_TIMEOUT_MS);
});

export { expect };
