import { test, expect } from '@main-fixtures';

test.describe('County parish holding (cph) number', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('cphNumber');
    await apiJourney.resumeInUi(created.referenceNumber, pages.cphNumber);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.cphNumber.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.cphNumber.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows empty cph number input on first load', async ({ pages }) => {
    await expect(pages.cphNumber.inputCphNumber).toHaveValue('');
    await expect(pages.cphNumber.inputCphNumber).toHaveAttribute('type', 'text');
    await expect(pages.cphNumber.inputCphNumber).toHaveAttribute('maxlength', '11');
  });

  test('returns to addresses after saving cph number', async ({ pages }) => {
    await pages.cphNumber.inputCphNumber.fill('123456789');
    await pages.cphNumber.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('accepts cph number with slashes and strips them on save', async ({ pages }) => {
    await pages.cphNumber.inputCphNumber.fill('123/456/789');
    await pages.cphNumber.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
    await expect(pages.addresses.cphNumber).toContainText('123456789');
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('limits cph number input to 11 characters', async ({ pages }) => {
      await pages.cphNumber.inputCphNumber.fill('1'.repeat(20));
      await expect(pages.cphNumber.inputCphNumber).toHaveValue('1'.repeat(11));
    });

    test('shows error when cph number is not entered', async ({ pages }) => {
      // Leave cph number on default "".
      await pages.cphNumber.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
      await expect(pages.cphNumber.errorCphNumber).toContainText('Enter a CPH number');
      const errorSummaryItems = await pages.originOfImport.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a CPH number');
    });

    test('shows error when cph number is not 9 digits', async ({ pages }) => {
      await pages.cphNumber.inputCphNumber.fill('12345678');
      await pages.cphNumber.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
      await expect(pages.cphNumber.errorCphNumber).toContainText('CPH number must be exactly 9 digits');
      const errorSummaryItems = await pages.cphNumber.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('CPH number must be exactly 9 digits');
    });

    test('shows error when cph number is not a number', async ({ pages }) => {
      await pages.cphNumber.inputCphNumber.fill('A'.repeat(9));
      await pages.cphNumber.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
      await expect(pages.cphNumber.errorCphNumber).toContainText('CPH number must only contain numbers');
      const errorSummaryItems = await pages.cphNumber.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('CPH number must only contain numbers');
    });

    test('shows both errors when cph number is not a number and not 9 digits', async ({ pages }) => {
      await pages.cphNumber.inputCphNumber.fill('1234567!');
      await pages.cphNumber.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
      await expect(pages.cphNumber.errorCphNumber).toContainText('CPH number must only contain numbers');
      const errorSummaryItems = await pages.cphNumber.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(2);
      expect(errorSummaryItems).toContain('CPH number must be exactly 9 digits');
      expect(errorSummaryItems).toContain('CPH number must only contain numbers');
    });
  });
});
