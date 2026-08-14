import { test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the check your answers page has no accessibility violations in its DRAFT and SUBMITTED states, including the submission confirmation', async ({
    apiJourney,
    pages,
    runA11yScan,
  }) => {
    await test.step('Check your answers (draft)', async () => {
      const draft = await apiJourney.createFullNotification();
      await apiJourney.resumeInUi(draft.referenceNumber, pages.notificationView);
      await runA11yScan();
    });

    const submitted = await apiJourney.createSubmittedNotification();

    await test.step('Check your answers (submitted, read-only)', async () => {
      await apiJourney.resumeInUi(submitted.referenceNumber, pages.notificationView);
      // The Delete action renders only in the read-only SUBMITTED state, so its
      // presence proves the scan sees the submitted view rather than the draft.
      await pages.page.getByRole('button', { name: 'Delete' }).waitFor();
      await runA11yScan();
    });

    await test.step('Import notification submitted (confirmation)', async () => {
      await pages.notificationView.navigateToFrontend(`/notifications/${submitted.referenceNumber}/confirmation`);
      await pages.page.getByRole('heading', { name: 'Import notification submitted' }).waitFor();
      await runA11yScan();
    });
  });
});
