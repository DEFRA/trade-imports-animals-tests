import { test, expect } from '@fixtures';

// Deliberate canaries, not page coverage: each test here proves the shared
// Joi + Hapi + govukErrorSummary validation pipeline renders correctly
// end-to-end in a real browser, once per distinct input pattern (select
// dropdown, radio group, checkbox). The exact error message text is
// already asserted by schema/controller unit tests, so don't add a test
// per page here — if a page's validation uses a pattern already
// represented below, it doesn't need its own E2E validation test; only
// add one for a genuinely new input pattern.
//
// Ordered to match where each pattern first appears in the notification
// journey (origin, then addresses sub-selection, then declaration).

test.describe('Required dropdown validation', { tag: '@validation' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toOriginOfImport();
  });

  test('shows error when country of origin is not selected', async ({ pages }) => {
    // Leave country of origin on default "Select a country".
    await pages.originOfImport.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
    const errorInline = pages.originOfImport.errorCountry;
    await expect(errorInline).toContainText('Select the country where the animal originates from');
    const errorSummaryItems = await pages.originOfImport.errorSummaryItems.allTextContents();
    expect(errorSummaryItems).toContain('Select the country where the animal originates from');
  });
});

test.describe('Required radio-group validation', { tag: '@validation' }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('consigneeSelection');
    await apiJourney.resumeInUi(created.referenceNumber, pages.consigneeSelection);
  });

  test('shows error when no selection made', async ({ pages }) => {
    await pages.consigneeSelection.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.consigneeSelection.expectedUrl);
    const errorItems = await pages.consigneeSelection.errorSummaryItems.allTextContents();
    expect(errorItems).toContain('Select a consignee');
  });
});

test.describe('Required checkbox validation', { tag: '@validation' }, () => {
  test.beforeEach(async ({ apiJourney, notificationActions, pages }) => {
    const created = await apiJourney.createFullNotification();
    await notificationActions.toNotificationView(created.referenceNumber);
    await pages.notificationView.btnConfirmAndSubmit.click();
    await pages.declaration.heading.waitFor();
  });

  test('shows error when declaration is not confirmed', async ({ pages }) => {
    await pages.declaration.btnSubmitNotification.click();
    await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
    await expect(pages.declaration.errorDeclaration).toContainText('Confirm that the information is true and correct before submitting');
    const errorSummaryItems = await pages.declaration.errorSummaryItems.allTextContents();
    expect(errorSummaryItems).toHaveLength(1);
    expect(errorSummaryItems).toContain('Confirm that the information is true and correct before submitting');
  });
});
