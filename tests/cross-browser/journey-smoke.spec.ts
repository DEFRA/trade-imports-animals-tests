import { test, expect } from '@fixtures';

/**
 * Lane A cross-browser smoke: the promoted sign-in + journey start renders across Chromium, Firefox and
 * WebKit. Thin by design — the deterministic journey net is the frontend canned suite; this only guards
 * against browser-specific sign-in / rendering regressions on the real-mode target.
 */
test.describe('Cross-browser journey smoke', { tag: '@cross-browser' }, () => {
  test('signs in and starts a notification', async ({ liveAnimalsJourney: journey, liveAnimalsPages: pages }) => {
    test.slow();
    const journeyId = await journey.startNotification();
    expect(journeyId).toBeTruthy();
    await expect(pages.overview.heading).toBeVisible();
  });

  test('signs in and starts a plant-products notification', async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    test.slow();
    const journeyId = await journey.startNotification();
    expect(journeyId).toBeTruthy();
    await expect(pages.hub.heading).toBeVisible();
  });
});
