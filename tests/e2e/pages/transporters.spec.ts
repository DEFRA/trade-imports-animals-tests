import { test, expect } from '@fixtures';

test.describe('Transporter', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toTransporter();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.transporter.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to entry point', async ({ pages }) => {
    await pages.transporter.linkBack.click();
    await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
    await expect(pages.entryPoint.heading).toBeVisible();
  });

  test('shows expected page content', async ({ pages }) => {
    await expect(pages.transporter.captionTransport).toBeVisible();
    await expect(pages.transporter.heading).toBeVisible();
    await expect(pages.transporter.linkAddTransporter).toBeVisible();
    await expect(pages.transporter.linkTransportGuidance).toBeVisible();
    await expect(pages.transporter.linkTransportGuidance).toHaveAttribute('target', '_blank');
    await expect(pages.transporter.btnSaveAndContinue).toBeVisible();
  });

  test('opens transport guidance link in a new tab with the expected URL', { tag: '@compose' }, async ({ context, pages }) => {
    const pagePromise = context.waitForEvent('page');
    await pages.transporter.linkTransportGuidance.click();
    const guidanceTab = await pagePromise;

    try {
      await guidanceTab.waitForLoadState('domcontentloaded');
      await expect(guidanceTab).toHaveURL('https://www.gov.uk/guidance/transporting-animals-in-great-britain');
    } finally {
      await guidanceTab.close();
    }
  });

  test('can navigate to transporter selection', async ({ pages }) => {
    await pages.transporter.linkAddTransporter.click();
    await expect(pages.page).toHaveURL(pages.transporterSelection.expectedUrl);
    await expect(pages.transporterSelection.heading).toBeVisible();
  });

  // Skipped until next page is implemented in EUDPA-48
  test.skip('continues to contact address after saving transporter', async ({ pages }) => {
    // TODO: add transporter details
    await pages.transporter.btnSaveAndContinue.click();
    //await expect(pages.page).toHaveURL(pages.contactAddress.expectedUrl);
    //await expect(pages.contactAddress.heading).toBeVisible();
  });
});
