import { test, expect } from '@fixtures';
import { TRANSPORTER_NAME } from '@domain/constants/journey-options';

test.describe('Contact address for consignment', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('contactAddress');
    await apiJourney.resumeInUi(created.referenceNumber, pages.contactAddress);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.contactAddress.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to transporter', async ({ pages }) => {
    await pages.contactAddress.linkBack.click();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
    await expect(pages.transporter.heading).toBeVisible();
    await expect(pages.transporter.cellsTransporter.nth(0)).toContainText(TRANSPORTER_NAME);
  });

  test('shows expected page content', async ({ pages }) => {
    await expect(pages.contactAddress.heading).toBeVisible();
    await expect(pages.contactAddress.paragraphDescription).toBeVisible();
    await expect(pages.contactAddress.groupSelectAddress).toBeVisible();
    await expect(pages.contactAddress.linkAddNewBranchAddress).toBeVisible();
    await expect(pages.contactAddress.btnSaveAndContinue).toBeVisible();
  });

  test('continues to review after selecting a contact address', async ({ pages, journeyContext }) => {
    await pages.contactAddress.radioAddress('EuroStore Services').click();
    await pages.contactAddress.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(journeyContext.referenceNumber));
    await expect(pages.notificationView.heading).toBeVisible();
  });
});
