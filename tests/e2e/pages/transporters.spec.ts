import { test, expect } from '@fixtures';

test.describe('Transporter', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('transporter');
    await apiJourney.resumeInUi(created.referenceNumber, pages.transporter);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.transporter.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to entry point', async ({ pages }) => {
    await pages.transporter.linkBack.click();
    await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
    await expect(pages.entryPoint.heading).toBeVisible();
  });

  test('shows expected page content', async ({ pages }) => {
    await expect(pages.transporter.heading).toBeVisible();
    await expect(pages.transporter.caption).toBeVisible();
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

  test('continues to contact address after saving transporter', async ({ pages }) => {
    await pages.transporter.linkAddTransporter.click();
    await pages.transporterSelection.linkSelectTransporter(0).click();
    await pages.transporter.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.contactAddress.expectedUrl);
    await expect(pages.contactAddress.heading).toBeVisible();
  });
});
