import { test, expect } from '@fixtures';

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

  // TODO: only Partial coverage elsewhere (controller.test.js) — it covers
  // the blank value, but the `type`/`maxlength` input attributes (static,
  // hardcoded in cph-number/index.njk) aren't asserted by any JS test.
  // Remove once closed, or accept the low risk of a hardcoded template
  // attribute and drop this instead.
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
    // TODO: only Partial coverage elsewhere (cph-number-schema.test.js /
    // controller.test.js) — the length and pattern messages are asserted
    // separately; no test submits a payload that fails both simultaneously.
    // Remove once closed.
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
