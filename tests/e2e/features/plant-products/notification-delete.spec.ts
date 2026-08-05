import { test, expect } from '@fixtures';

const plantDashboardUrl = /^\/plant-products(?:\?.*)?$/;

test.describe('Plant-products notification delete', { tag: '@integration' }, () => {
  test('dashboard delete can be cancelled, then soft-deletes by reference and remains idempotent', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const created = await apiJourney.createFullNotification();
    const reference = created.referenceNumber;

    await actions.delete(reference);

    await expect(pages.page).toHaveURL((url) => new RegExp(`^/plant-products/notifications/${reference}/delete$`).test(url.pathname));
    await expect(pages.deleteConfirmation.heading).toBeVisible();
    await expect(pages.deleteConfirmation.body).toBeVisible();
    await expect(pages.page.getByText(reference, { exact: true })).toBeVisible();
    await actions.keepNotification();

    await expect(pages.page).toHaveURL((url) => plantDashboardUrl.test(`${url.pathname}${url.search}`));
    await pages.plantNotificationDashboard.searchForReference(reference);
    await expect(pages.plantNotificationDashboard.row(reference)).toBeVisible();

    await actions.delete(reference);
    await actions.confirmDelete();

    await expect(pages.page).toHaveURL((url) => /^\/plant-products\?deleted=1$/.test(`${url.pathname}${url.search}`));
    await expect(pages.page.getByRole('alert')).toContainText('The notification has been deleted.');
    await expect(pages.plantNotificationDashboard.row(reference)).toHaveCount(0);
    expect(await plantProductsApi.load(reference)).toMatchObject({ referenceNumber: reference, status: 'DELETED' });
    expect((await plantProductsApi.list({ referenceNumber: reference })).content).toEqual([]);

    const deletedAgain = await plantProductsApi.setStatus(reference, { status: 'DELETED' });
    expect(deletedAgain).toMatchObject({ referenceNumber: reference, status: 'DELETED' });
  });

  test('read-only notification delete cancels back to its view and confirms under the plant dashboard', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const submitted = await apiJourney.createSubmittedNotification();
    const reference = submitted.referenceNumber;
    const reviewPath = `/plant-products/notifications/${reference}/review-notification`;

    await pages.notificationView.open(reference);
    await actions.deleteFromView();

    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^/plant-products/notifications/${reference}/delete\\?source=notification-view$`).test(`${url.pathname}${url.search}`),
    );
    await expect(pages.page.getByText(reference, { exact: true })).toBeVisible();
    await actions.keepNotification();

    await expect(pages.page).toHaveURL((url) => new RegExp(`^${reviewPath}$`).test(url.pathname));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.delete).toBeVisible();

    await actions.deleteFromView();
    await actions.confirmDelete();

    await expect(pages.page).toHaveURL((url) => /^\/plant-products\?deleted=1$/.test(`${url.pathname}${url.search}`));
    expect(await plantProductsApi.load(reference)).toMatchObject({ referenceNumber: reference, status: 'DELETED' });
    expect((await plantProductsApi.list({ referenceNumber: reference })).content).toEqual([]);
  });
});
