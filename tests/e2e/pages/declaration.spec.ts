import { test, expect } from '@fixtures';
import { getRelativeDate, toDisplayDate } from '@utils/date-utils';

test.describe('Declaration', () => {
  test.beforeEach(async ({ apiJourney, notificationActions, pages }) => {
    const created = await apiJourney.createFullNotification();
    await notificationActions.toNotificationView(created.referenceNumber);
    await pages.notificationView.btnConfirmAndSubmit.click();
    await pages.declaration.heading.waitFor();
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.declaration.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to review', async ({ pages, journeyContext }) => {
    await pages.declaration.linkBack.click();
    await expect(pages.page).toHaveURL(pages.notificationView.expectedUrl(journeyContext.referenceNumber));
    await expect(pages.notificationView.heading).toBeVisible();
  });

  // TODO: no coverage elsewhere — heading/checkbox/date/submit-button
  // presence isn't tested by any controller or template test. Remove once
  // closed.
  test('shows expected page content', async ({ pages }) => {
    await expect(pages.declaration.heading).toBeVisible();
    await expect(pages.declaration.responsibilityConfirmation).toBeVisible();
    await expect(pages.declaration.checkboxDeclaration).toBeVisible();
    await expect(pages.declaration.dateOfDeclaration).toBeVisible();
    await expect(pages.declaration.btnSubmitNotification).toBeVisible();
  });

  // TODO: only Partial coverage elsewhere (controller.test.js) — it confirms
  // submissionDate is passed to the view (expect.any(String)), not the
  // specific relative-date value or checkbox default. Remove once closed.
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
});
