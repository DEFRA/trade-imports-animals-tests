import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/types/country-codes';

test.describe('Select a commodity', () => {
  test.beforeEach(async ({ pages }) => {
    await pages.notificationDashboard.open();
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await pages.originOfImport.dropdownCountry.selectOption(countryCodes.eu.france);
    await pages.originOfImport.btnSaveAndContinue.click();
  });

  test('shows system-generated notification id', async ({ pages }) => {
    const notificationId = await pages.commoditySelection.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
  });
});
