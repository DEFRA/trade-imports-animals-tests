import { test, expect } from '@fixtures';
import { getRelativeDate, toDisplayDate } from '@utils/date-utils';

test.describe('Declaration', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toDeclaration();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.declaration.notificationId.textContent();
    expect(notificationId).toMatch(/^DRAFT\.IMP\.\d{4}\.[0-9a-f]{24}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to review', async ({ pages }) => {
    await pages.declaration.linkBack.click();
    // TODO: pending review page implementation, temporarily navigates to transporter page.
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
    await expect(pages.transporter.heading).toBeVisible();
  });

  test('shows expected page content', async ({ pages }) => {
    await expect(pages.declaration.heading).toBeVisible();
    await expect(pages.declaration.responsibilityConfirmation).toBeVisible();
    await expect(pages.declaration.checkboxDeclaration).toBeVisible();
    await expect(pages.declaration.dateOfDeclaration).toBeVisible();
    await expect(pages.declaration.btnSubmitNotification).toBeVisible();
  });

  test('shows default values on first load', async ({ pages }) => {
    const expectedDeclarationDate = toDisplayDate(getRelativeDate());
    await expect(pages.declaration.checkboxDeclaration).not.toBeChecked();
    await expect(pages.declaration.dateOfDeclaration).toHaveText(`Date of declaration: ${expectedDeclarationDate}`);
  });

  test('continues to submission confirmation after submitting notification', async ({ pages }) => {
    await pages.declaration.checkboxDeclaration.click();
    await pages.declaration.btnSubmitNotification.click();
    // TODO: pending submission confirmation page implementation, temporarily stays on declaration page.
    await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
    await expect(pages.declaration.heading).toBeVisible();
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when declaration is not confirmed', async ({ pages }) => {
      await pages.declaration.btnSubmitNotification.click();
      await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
      await expect(pages.declaration.errorDeclaration).toContainText('Confirm that the information is true and correct before submitting');
      const errorSummaryItems = await pages.declaration.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Confirm that the information is true and correct before submitting');
    });
  });
});
