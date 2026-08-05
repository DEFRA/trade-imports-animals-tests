import { test, expect } from '@fixtures';

// From the frontend's plant-products flow/fixtures/happy-path.json.
const amendedInternalReference = 'IMPORT-041';

const reviewUrl = (reference: string, query = '') => new RegExp(`^/plant-products/notifications/${reference}/review-notification${query}$`);

test.describe('Plant-products cancel amendment through the UI', { tag: '@integration' }, () => {
  test('the confirmation copy names the notification and No leaves the amendment in progress', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const submitted = await apiJourney.createSubmittedNotification();
    const reference = submitted.referenceNumber;
    await plantProductsApi.setStatus(reference, { status: 'AMEND' });

    await actions.cancelAmend(reference);

    await expect(pages.page).toHaveURL((url) => new RegExp(`^/plant-products/notifications/${reference}/cancel-amend$`).test(url.pathname));
    await expect(pages.cancelAmend.heading).toBeVisible();
    await expect(pages.cancelAmend.body).toBeVisible();
    await expect(pages.page.getByText(reference, { exact: true })).toBeVisible();
    await expect(pages.cancelAmend.confirm).toBeVisible();
    await expect(pages.cancelAmend.reject).toBeVisible();

    await actions.keepAmend();

    await expect(pages.page).toHaveURL((url) => reviewUrl(reference).test(url.pathname));
    await expect(pages.page.getByText('Amending', { exact: true })).toBeVisible();
    await expect(pages.notificationView.cancelAmend).toBeVisible();
    expect((await plantProductsApi.load(reference)).status).toBe('AMEND');
  });

  test('Yes discards the working edit and restores the submitted baseline', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const submitted = await apiJourney.createSubmittedNotification();
    const reference = submitted.referenceNumber;
    const submittedInternalReference = submitted.origin?.internalReference;
    if (!submittedInternalReference) throw new Error('Submitted notification has no internal reference');
    await plantProductsApi.setStatus(reference, { status: 'AMEND' });
    const amending = await plantProductsApi.load(reference);
    await plantProductsApi.replace(reference, {
      ...amending,
      origin: { ...amending.origin, internalReference: amendedInternalReference },
    });

    await pages.notificationView.open(reference);
    await expect(pages.notificationView.value('About the consignment', 'Internal reference')).toHaveText(amendedInternalReference);
    await actions.cancelAmendFromView();
    await actions.confirmCancelAmend();

    await expect(pages.page).toHaveURL((url) => reviewUrl(reference, '\\?cancelled=1').test(`${url.pathname}${url.search}`));
    await expect(pages.page.getByRole('alert')).toContainText('The amendment has been cancelled and the submitted version restored.');
    await expect(pages.notificationView.value('About the consignment', 'Internal reference')).toHaveText(submittedInternalReference);
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    const restored = await plantProductsApi.load(reference);
    expect(restored.status).toBe('SUBMITTED');
    expect(restored.origin?.internalReference).toBe(submittedInternalReference);
  });
});
