import { expect, test, WCAG_STANDARD } from '@fixtures/a11y';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the plant review route has no accessibility violations in DRAFT, SUBMITTED and AMEND states, including confirmation', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    runA11yScan,
  }) => {
    const statusTag = pages.page.locator('.app-journey-strip .govuk-tag');
    const draft = await apiJourney.createFullNotification();

    await test.step('Review notification (draft)', async () => {
      await pages.reviewNotification.open(draft.referenceNumber);
      await pages.reviewNotification.heading.waitFor();
      // Trace finding: the legacy a11y suite scanned this surface only in DRAFT.
      // The state-specific scans below prevent repeating that coverage gap.
      // A separate trace finding recorded three distinct legacy controls all named
      // "Copy"; axe cannot detect that semantic ambiguity. The rebuilt route does
      // not currently render Copy controls, so a green scan is not assurance that
      // future lifecycle actions have distinguishable accessible names.
      await expect(statusTag).toBeVisible();
      await expect(statusTag).toHaveText('Draft');
      await runA11yScan();
    });

    const submitted = await apiJourney.createSubmittedNotification();

    await test.step('Review notification (submitted)', async () => {
      // The current plant dashboard has no View action for SUBMITTED, so this
      // direct route is how the read-only view is reached. It renders with no
      // change links, no commodity Action column and no resubmission form, so
      // this step scans the read-only surface rather than the editable one.
      await pages.reviewNotification.open(submitted.referenceNumber, false);
      await pages.reviewNotification.heading.waitFor();
      await expect(statusTag).toBeVisible();
      await expect(statusTag).toHaveText('Submitted');
      await runA11yScan();
    });

    await test.step('Import notification sent (confirmation)', async () => {
      await pages.confirmation.open(submitted.referenceNumber, false);
      await pages.confirmation.heading.waitFor();
      await runA11yScan();
    });

    await test.step('Review notification (amendment)', async () => {
      const amending = await apiJourney.createSubmittedNotification();
      await plantProductsApi.setStatus(amending.referenceNumber, { status: 'AMEND' });
      await pages.reviewNotification.open(amending.referenceNumber, false);
      await pages.reviewNotification.heading.waitFor();
      await expect(statusTag).toBeVisible();
      await expect(statusTag).toHaveText('Amending');
      await runA11yScan();
    });
  });
});
