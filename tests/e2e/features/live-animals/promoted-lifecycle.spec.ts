import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { notificationFulfilmentsStatuses } from '@domain/live-animals/models/api/notification-fulfilments';
import { notificationStatuses } from '@domain/live-animals/models/api/notification';

test.describe('Promoted lifecycle across both aggregates', { tag: ['@compose', '@integration'] }, () => {
  test('dual-writes create/submit/amend/cancel/soft-delete to both /notifications and /notification-fulfilments, and notification-fulfilments copy stays idempotent', async ({
    notificationApi,
  }) => {
    // Notification mints the ref; notification-fulfilments is bootstrapped at that same ref.
    const notification = await notificationApi.createNotification();
    const id = notification.referenceNumber;
    expect(notification.status).toBe(notificationStatuses.draft);

    const draft = await notificationApi.replaceNotificationFulfilments(id, []);
    expect(draft.id).toBe(id);
    expect(draft.status).toBe(notificationFulfilmentsStatuses.draft);

    // Submit both sides.
    const submittedNotificationFulfilments = await notificationApi.submitNotificationFulfilments(id);
    const submittedNotification = await notificationApi.submitNotification(id);
    expect(submittedNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.submitted);
    expect(submittedNotification.status).toBe(notificationStatuses.submitted);

    // Amend both sides.
    const amendedNotificationFulfilments = await notificationApi.amendNotificationFulfilments(id);
    const amendedNotification = await notificationApi.amendNotification(id);
    expect(amendedNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.amend);
    expect(amendedNotificationFulfilments.submittedFulfilments).toEqual([]);
    expect(amendedNotification.status).toBe(notificationStatuses.amend);

    // Cancel-amend both sides.
    const cancelledNotificationFulfilments = await notificationApi.cancelAmendNotificationFulfilments(id);
    const cancelledNotification = await notificationApi.cancelAmendNotification(id);
    expect(cancelledNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.submitted);
    expect(cancelledNotification.status).toBe(notificationStatuses.submitted);

    // NotificationFulfilments copy carries an idempotency key; the notification
    // copy on main has no equivalent (POST /notifications/{id}/copy takes no key),
    // so this spec only exercises the notification-fulfilments side of copy.
    const key = randomUUID();
    const copiedNotificationFulfilments = await notificationApi.copyNotificationFulfilments(id, key);
    const repeatedCopy = await notificationApi.copyNotificationFulfilments(id, key);
    expect(copiedNotificationFulfilments.id).not.toBe(id);
    expect(repeatedCopy.id).toBe(copiedNotificationFulfilments.id);
    expect(copiedNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.draft);

    // Soft-delete both sides; both are idempotent.
    const deletedNotificationFulfilments = await notificationApi.softDeleteNotificationFulfilments(id);
    const deletedNotification = await notificationApi.softDeleteNotification(id);
    expect(deletedNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.deleted);
    expect(deletedNotification.status).toBe(notificationStatuses.deleted);

    const repeatDelete = await notificationApi.softDeleteNotificationFulfilments(id);
    expect(repeatDelete.status).toBe(notificationFulfilmentsStatuses.deleted);
  });

  test('renders a submitted notification read-only and re-enters an amendment at Overview', async ({
    liveAnimalsJourney: journey,
    journeyContext,
    liveAnimalsPages: pages,
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
