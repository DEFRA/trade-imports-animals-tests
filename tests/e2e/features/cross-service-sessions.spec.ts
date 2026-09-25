import { test, expect } from '@fixtures';
import { COLD_START, authCookieNameFor } from '@fixtures/auth-state';
import { requireBaseUrl } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

// This test IS the three sign-ins, so it starts unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Sessions across services', { tag: ['@compose', '@integration'] }, () => {
  test('signing in to animals, then ins, then plants in one browser keeps all three sessions', async ({ pages }) => {
    test.slow();
    const animalsBaseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const insBaseUrl = requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL');
    const plantsBaseUrl = requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL');

    // Given — the trader signs in to each service in turn, in one browser
    await pages.notificationDashboard.open();
    await expect(pages.notificationDashboard.heading).toBeVisible();
    await pages.insDashboard.open();
    await expect(pages.insDashboard.heading).toBeVisible();
    await pages.plantsDashboard.open();
    await expect(pages.plantsDashboard.heading).toBeVisible();

    // When / Then — each service opens again without asking them to sign in
    await pages.notificationDashboard.open(false);
    await expect(pages.page).toHaveURL((url) => url.origin === new URL(animalsBaseUrl).origin && url.pathname === SET_BASES.liveAnimals);
    await expect(pages.notificationDashboard.heading).toBeVisible();

    await pages.insDashboard.open(false);
    await expect(pages.page).toHaveURL(
      (url) => url.origin === new URL(insBaseUrl).origin && url.pathname === pages.insDashboard.expectedUrl,
    );
    await expect(pages.insDashboard.heading).toBeVisible();

    await pages.plantsDashboard.open(false);
    await expect(pages.page).toHaveURL((url) => url.origin === new URL(plantsBaseUrl).origin && url.pathname === SET_BASES.highRiskPlants);
    await expect(pages.plantsDashboard.heading).toBeVisible();

    // And — each service holds its own session cookie
    const cookieNames = (await pages.page.context().cookies()).map(({ name }) => name);
    expect(cookieNames).toEqual(
      expect.arrayContaining([
        authCookieNameFor('e2e', animalsBaseUrl),
        authCookieNameFor('ins', insBaseUrl),
        authCookieNameFor('plants', plantsBaseUrl),
      ]),
    );
  });
});
