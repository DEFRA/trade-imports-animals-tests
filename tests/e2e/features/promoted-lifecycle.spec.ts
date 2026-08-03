import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { fulfilmentStatuses } from '@domain/models/api/fulfilment';
import { notificationStatuses } from '@domain/models/api/notification';

test.describe('Promoted lifecycle across both aggregates', { tag: ['@compose', '@integration'] }, () => {
  test('dual-writes create/submit/amend/cancel/soft-delete to both /notifications and /fulfilments, and fulfilment copy stays idempotent', async ({
    notificationApi,
  }) => {
    // Notification mints the ref; fulfilment is bootstrapped at that same ref.
    const notification = await notificationApi.createNotification();
    const id = notification.referenceNumber;
    expect(notification.status).toBe(notificationStatuses.draft);

    const draft = await notificationApi.replaceFulfilment(id, []);
    expect(draft.id).toBe(id);
    expect(draft.status).toBe(fulfilmentStatuses.draft);

    // Submit both sides.
    const submittedFulfilment = await notificationApi.submitFulfilment(id);
    const submittedNotification = await notificationApi.submitNotification(id);
    expect(submittedFulfilment.status).toBe(fulfilmentStatuses.submitted);
    expect(submittedNotification.status).toBe(notificationStatuses.submitted);

    // Amend both sides.
    const amendedFulfilment = await notificationApi.amendFulfilment(id);
    const amendedNotification = await notificationApi.amendNotification(id);
    expect(amendedFulfilment.status).toBe(fulfilmentStatuses.amend);
    expect(amendedFulfilment.submittedFulfilment).toEqual([]);
    expect(amendedNotification.status).toBe(notificationStatuses.amend);

    // Cancel-amend both sides.
    const cancelledFulfilment = await notificationApi.cancelAmendFulfilment(id);
    const cancelledNotification = await notificationApi.cancelAmendNotification(id);
    expect(cancelledFulfilment.status).toBe(fulfilmentStatuses.submitted);
    expect(cancelledNotification.status).toBe(notificationStatuses.submitted);

    // Fulfilment copy carries an idempotency key; the notification copy on main
    // has no equivalent (POST /notifications/{id}/copy takes no key), so this
    // spec only exercises the fulfilment side of copy.
    const key = randomUUID();
    const copiedFulfilment = await notificationApi.copyFulfilment(id, key);
    const repeatedCopy = await notificationApi.copyFulfilment(id, key);
    expect(copiedFulfilment.id).not.toBe(id);
    expect(repeatedCopy.id).toBe(copiedFulfilment.id);
    expect(copiedFulfilment.status).toBe(fulfilmentStatuses.draft);

    // Soft-delete both sides; both are idempotent.
    const deletedFulfilment = await notificationApi.softDeleteFulfilment(id);
    const deletedNotification = await notificationApi.softDeleteNotification(id);
    expect(deletedFulfilment.status).toBe(fulfilmentStatuses.deleted);
    expect(deletedNotification.status).toBe(notificationStatuses.deleted);

    const repeatFulfilmentDelete = await notificationApi.softDeleteFulfilment(id);
    expect(repeatFulfilmentDelete.status).toBe(fulfilmentStatuses.deleted);
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
