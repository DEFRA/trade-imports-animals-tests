import { test, expect } from '@fixtures';
import { TRANSPORTER_NAME } from '@domain/constants/journey-options';

test.describe('Contact address for consignment', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('contactAddress');
    await apiJourney.resumeInUi(created.referenceNumber, pages.contactAddress);
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.contactAddress.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
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

  test('shows addresses unchecked by default', async ({ pages }) => {
    await expect(pages.contactAddress.radioAddress('Lowland Cattle Co 6')).toBeVisible();
    await expect(pages.contactAddress.radioAddress('Lowland Cattle Co 6')).not.toBeChecked();
    await expect(pages.contactAddress.radioAddress('Highland Livestock Ltd 20')).toBeVisible();
    await expect(pages.contactAddress.radioAddress('Highland Livestock Ltd 20')).not.toBeChecked();
    await expect(pages.contactAddress.radioAddress('Glen Valley Farms 13')).toBeVisible();
    await expect(pages.contactAddress.radioAddress('Glen Valley Farms 13')).not.toBeChecked();
  });

  test('can select only one address at a time', async ({ pages }) => {
    await pages.contactAddress.radioAddress('Lowland Cattle Co 6').click();
    await expect(pages.contactAddress.radioAddress('Lowland Cattle Co 6')).toBeChecked();
    await expect(pages.contactAddress.radioAddress('Highland Livestock Ltd 20')).not.toBeChecked();
    await pages.contactAddress.radioAddress('Highland Livestock Ltd 20').click();
    await expect(pages.contactAddress.radioAddress('Lowland Cattle Co 6')).not.toBeChecked();
    await expect(pages.contactAddress.radioAddress('Highland Livestock Ltd 20')).toBeChecked();
  });

  test('continues to review after selecting a contact address', async ({ pages, journeyContext }) => {
    await pages.contactAddress.radioAddress('Lowland Cattle Co 6').click();
    await pages.contactAddress.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(journeyContext.notificationId));
    await expect(pages.notificationView.heading).toBeVisible();
  });
});
