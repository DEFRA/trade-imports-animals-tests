import { test as base, expect } from '@fixtures';
import { scanPage, formatSummaries, type A11yScanOptions, type ViolationSummary } from '@utils/a11y-utils';

export interface A11yFixtures {
  runA11yScan: (options?: A11yScanOptions) => Promise<void>;
}

export const test = base.extend<A11yFixtures>({
  runA11yScan: async ({ page }, use, testInfo) => {
    // Before test: initialise results collection
    const results: ViolationSummary[] = [];

    // During test: each runA11yScan() call scans the current page and collects results
    await use(async (options) => {
      const summary = await scanPage(page, options);
      results.push(summary);
    });

    // After test: guard against tests that destructure runA11yScan but never call it
    if (results.length === 0) throw new Error('No accessibility scans were run. Call runA11yScan() at least once.');

    // After test: attach a JSON artefact per page with violations
    for (const { path, violations } of results) {
      if (violations.length > 0) {
        await testInfo.attach(`accessibility-violations: ${path}`, {
          body: JSON.stringify(violations, null, 2),
          contentType: 'application/json',
        });
      }
    }

    // After test: throw a combined error if any page had violations
    const message = formatSummaries(results);
    if (message) throw new Error(message);
  },
});

export { expect };
