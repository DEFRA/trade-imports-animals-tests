import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

test.describe('Change from check your answers', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('a Change link opens the answering page with change context and the save returns to check your answers with the new value', async ({
    journey,
    pages,
  }) => {
    test.slow();
    await journey.toReview();

    // Origin leg: the Change link threads ?change=1 to the answering page, so
    // the save exits back to check your answers instead of the flow target.
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await pages.notificationView.changeLink('Change country of origin').click();
    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/[^/]+/origin\\?change=1$`).test(`${url.pathname}${url.search}`),
    );
    await pages.originOfImport.selectCountry('Belgium');
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/[^/]+/notification-view$`).test(url.pathname),
    );
    await expect(countryRow).toContainText('Belgium');

    // Reason leg: without change context this save would continue into the
    // reason section flow; under change context it returns to the summary.
    const reasonRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Reason for import' });
    await expect(reasonRow).toContainText('Internal market');
    await pages.notificationView.changeLink('Change reason for import').click();
    await expect(pages.importReason.heading).toBeVisible();
    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/[^/]+/import-reason\\?change=1$`).test(`${url.pathname}${url.search}`),
    );
    await pages.importReason.reason('Re-entry').check();
    await pages.importReason.saveAndContinue.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/[^/]+/notification-view$`).test(url.pathname),
    );
    await expect(reasonRow).toContainText('Re-entry');
  });
});
