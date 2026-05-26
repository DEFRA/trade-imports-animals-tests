import { test, expect } from '@fixtures';

test.describe('Contact address for consignment', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toContactAddress();
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
  });

  test('shows expected page content', async ({ pages }) => {
    await expect(pages.contactAddress.heading).toBeVisible();
    await expect(pages.contactAddress.paragraphDescription).toBeVisible();
    await expect(pages.contactAddress.groupSelectAddress).toBeVisible();
    await expect(pages.contactAddress.linkAddNewBranchAddress).toBeVisible();
    await expect(pages.contactAddress.btnSaveAndContinue).toBeVisible();
  });

  test('shows addresses unchecked by default', async ({ pages }) => {
    await expect(pages.contactAddress.radioAddress('Animal and Plant Health Agency')).toBeVisible();
    await expect(pages.contactAddress.radioAddress('Animal and Plant Health Agency')).not.toBeChecked();
    await expect(pages.contactAddress.radioAddress('EuroStore Services')).toBeVisible();
    await expect(pages.contactAddress.radioAddress('EuroStore Services')).not.toBeChecked();
    await expect(pages.contactAddress.radioAddress('Laiterie du Nord SARL')).toBeVisible();
    await expect(pages.contactAddress.radioAddress('Laiterie du Nord SARL')).not.toBeChecked();
  });

  test('can select only one address at a time', async ({ pages }) => {
    await pages.contactAddress.radioAddress('Animal and Plant Health Agency').click();
    await expect(pages.contactAddress.radioAddress('Animal and Plant Health Agency')).toBeChecked();
    await expect(pages.contactAddress.radioAddress('EuroStore Services')).not.toBeChecked();
    await pages.contactAddress.radioAddress('EuroStore Services').click();
    await expect(pages.contactAddress.radioAddress('Animal and Plant Health Agency')).not.toBeChecked();
    await expect(pages.contactAddress.radioAddress('EuroStore Services')).toBeChecked();
  });

  test('continues to review after selecting a contact address', async ({ pages }) => {
    await pages.contactAddress.radioAddress('EuroStore Services').click();
    await pages.contactAddress.btnSaveAndContinue.click();
    // TODO: pending review page implementation, temporarily navigates to declaration pages.
    await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
    await expect(pages.declaration.heading).toBeVisible();
  });
});
