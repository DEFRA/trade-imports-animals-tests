import { test, expect } from '@fixtures';

const GBN_REFERENCE = /GBN-AG-\d{2}-[0-9A-HJKMNP-TV-Z]{6}/;

test.describe('Reference strip', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the Draft tag and GBN-AG reference show on the hub and task pages, and are absent before the first save', async ({ pages }) => {
    const strip = pages.overview.journeyStrip;

    // The dashboard precedes any journey — no strip.
    await pages.notificationDashboard.open();
    await expect(pages.notificationDashboard.heading).toBeVisible();
    await expect(strip).toHaveCount(0);

    // The entry page shows nothing while the journey has no notification
    // answers — the reference is minted at the origin POST...
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await expect(pages.originOfImport.heading).toBeVisible();
    const journeyId = pages.originOfImport.journeyIdFromUrl();
    await expect(strip).toHaveCount(0);

    // ...and carries the strip once its first save has committed answers.
    await pages.originOfImport.selectCountry('France');
    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();

    // The hub carries the strip: blue Draft tag + GBN-AG-shaped reference.
    await pages.overview.open(journeyId);
    await expect(strip).toBeVisible();
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_REFERENCE);

    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(strip).toBeVisible();
    await expect(strip).toContainText(GBN_REFERENCE);

    // Every post-origin task page inherits the strip from the shared layout.
    await pages.overview.open(journeyId);
    await pages.overview.task('What are you importing?').click();
    await expect(pages.commoditySelection.species('Bos taurus')).toBeVisible();
    await expect(strip).toBeVisible();
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_REFERENCE);
  });
});
