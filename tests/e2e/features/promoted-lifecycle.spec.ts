import { test, expect } from '@fixtures';
import { notificationFulfilmentsStatuses } from '@domain/models/api/notification-fulfilments';
import { notificationStatuses } from '@domain/models/api/notification';

test.describe('Merged notification aggregate lifecycle (EUDPA-323)', { tag: ['@compose', '@integration'] }, () => {
  test('creates, submits, amends, cancels, copies and soft-deletes the merged aggregate via the /notifications endpoints; fulfilment view reflects each transition; copy no longer dedupes', async ({
    notificationApi,
  }) => {
    // Create the merged aggregate. Backend mints the reference number and returns
    // the merged Notification entity carrying the empty fulfilments payload.
    const notification = await notificationApi.createNotification({ fulfilments: [] });
    const id = notification.referenceNumber;
    expect(notification.status).toBe(notificationStatuses.draft);

    // Fulfilment-view read reflects the same aggregate under a shape-specialised projection.
    const initial = await notificationApi.getNotificationFulfilments(id);
    expect(initial.id).toBe(id);
    expect(initial.status).toBe(notificationFulfilmentsStatuses.draft);
    expect(initial.fulfilments).toEqual([]);

    // Submit — single call to the merged endpoint.
    const submitted = await notificationApi.submitNotification(id);
    expect(submitted.status).toBe(notificationStatuses.submitted);
    const submittedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(submittedFulfilments.status).toBe(notificationFulfilmentsStatuses.submitted);

    // Amend.
    const amended = await notificationApi.amendNotification(id);
    expect(amended.status).toBe(notificationStatuses.amend);
    const amendedFulfilments = await notificationApi.getNotificationFulfilments(id);
    expect(amendedFulfilments.status).toBe(notificationFulfilmentsStatuses.amend);

    // Cancel-amend.
    const cancelled = await notificationApi.cancelAmendNotification(id);
    expect(cancelled.status).toBe(notificationStatuses.submitted);

    // Copy no longer dedupes (Idempotency-Key dropped pending EUDPA-314) — two calls produce two distinct copies.
    const firstCopy = await notificationApi.copyNotification(id);
    const secondCopy = await notificationApi.copyNotification(id);
    expect(firstCopy.referenceNumber).not.toBe(id);
    expect(secondCopy.referenceNumber).not.toBe(firstCopy.referenceNumber);
    expect(firstCopy.status).toBe(notificationStatuses.draft);
    expect(secondCopy.status).toBe(notificationStatuses.draft);

    // Soft-delete is idempotent — repeated calls return the DELETED aggregate unchanged.
    const deleted = await notificationApi.softDeleteNotification(id);
    expect(deleted.status).toBe(notificationStatuses.deleted);
    const repeatDelete = await notificationApi.softDeleteNotification(id);
    expect(repeatDelete.status).toBe(notificationStatuses.deleted);
  });

  test('renders a submitted notification read-only and re-enters an amendment at Overview', async ({
    journey,
    journeyContext,
    pages,
    notificationActions,
  }) => {
    await journey.submitNotification();
    await notificationActions.toNotificationView(journeyContext.journeyId);

    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);

    await notificationActions.amendNotification(journeyContext.journeyId);
    await expect(pages.overview.heading).toBeVisible();
    await expect(pages.overview.journeyStrip).toContainText('Amending');
  });
});
