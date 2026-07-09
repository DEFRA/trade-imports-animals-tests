import type { Page } from '@playwright/test';
import { test, WCAG_STANDARD } from '@fixtures/a11y';

const scanViewports = {
  /**
   * Re-run every scan at this width after the page's current viewport, since
   * axe only sees what's rendered (e.g. collapsed navigation) and target-size
   * depends on rendered geometry — desktop-only scans miss small-screen issues.
   * 320 CSS px is the WCAG 1.4.10 Reflow width (a 1280px desktop at 400% zoom)
   * and govuk-frontend's smallest breakpoint; height barely matters since axe
   * scans the whole document, so 568 just matches Playwright's iPhone SE
   * descriptor.
   */
  narrowPortrait: { width: 320, height: 568 },

  /**
   * Re-run every scan in landscape too, since axe only sees what's rendered —
   * a portrait-only scan misses layout that breaks on rotation (WCAG 1.3.4
   * Orientation) and the other half of 1.4.10 Reflow (the 256 CSS px
   * "horizontal scroll" height threshold, alongside the narrow viewport's
   * 320 CSS px width one). 568x320 is simply the narrow viewport rotated —
   * Playwright's iPhone SE descriptor in landscape — rather than an
   * arbitrary short height.
   */
  narrowLandscape: { width: 568, height: 320 },
} as const;

// Guards against a race condition: setViewportSize() resolves once the
// browser applies the new metrics, but doesn't wait for any JS that reacts
// to viewport changes (matchMedia listeners, resize handlers) to run — so a
// scan could see stale layout. This is generic browser behaviour: the HTML
// spec guarantees those events fire before the next animation frame, so
// waiting one rAF reliably lets them settle first.
const waitForViewportSettle = (page: Page): Promise<void> =>
  page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toNotificationDashboard();
  });

  test('the notification dashboard has no accessibility violations across viewports', async ({ page, runA11yScan }) => {
    await test.step('Notification dashboard (default viewport)', async () => {
      await runA11yScan();
    });

    await test.step('Notification dashboard (narrow portrait)', async () => {
      await page.setViewportSize(scanViewports.narrowPortrait);
      await waitForViewportSettle(page);
      await runA11yScan();
    });

    await test.step('Notification dashboard (narrow landscape)', async () => {
      await page.setViewportSize(scanViewports.narrowLandscape);
      await waitForViewportSettle(page);
      await runA11yScan();
    });
  });
});
