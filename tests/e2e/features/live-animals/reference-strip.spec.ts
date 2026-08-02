import { test, expect } from '@fixtures';

const GBN_REFERENCE = /GBN-AG-\d{2}-[0-9A-HJKMNP-TV-Z]{6}/;

test.describe('Reference strip', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the Draft tag and GBN-AG reference show on the hub and task pages, and are absent on pre-origin surfaces', async ({
    liveAnimalsJourney: journey,
    liveAnimalsPages: pages,
  }) => {
    const strip = pages.overview.journeyStrip;

    // The dashboard precedes any journey — no strip.
    await pages.notificationDashboard.open();
    await expect(pages.notificationDashboard.heading).toBeVisible();
    await expect(strip).toHaveCount(0);

    const journeyId = await journey.startNotification();

    // The hub carries the strip: blue Draft tag + GBN-AG-shaped reference.
    await expect(strip).toBeVisible();
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_REFERENCE);

    // The import-type filter is a pre-origin surface — never a strip.
    await pages.importType.open(journeyId);
    await expect(pages.importType.heading).toBeVisible();
    await expect(strip).toHaveCount(0);

    // Origin shows nothing while the journey has no notification answers — the
    // service-routing importType saved by the filter does not count: the
    // reference is minted at the origin POST...
    await pages.overview.open(journeyId);
    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(strip).toHaveCount(0);

    // ...and carries the strip once its first save has committed answers.
    await pages.originOfImport.selectCountry('France');
    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
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
