import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { fulfilmentStatuses } from '@domain/live-animals/models/api/fulfilment';

test.describe('Promoted notification lifecycle', { tag: ['@compose', '@integration'] }, () => {
  test('creates, submits, amends, cancels, copies idempotently and soft-deletes through /fulfilments', async ({ notificationApi }) => {
    const draft = await notificationApi.createFulfilment();
    expect(draft.status).toBe(fulfilmentStatuses.draft);

    const submitted = await notificationApi.submitNotification(draft.id);
    expect(submitted.status).toBe(fulfilmentStatuses.submitted);

    const amend = await notificationApi.amendNotification(draft.id);
    expect(amend.status).toBe(fulfilmentStatuses.amend);
    expect(amend.submittedFulfilment).toEqual([]);

    const cancelled = await notificationApi.cancelAmend(draft.id);
    expect(cancelled.status).toBe(fulfilmentStatuses.submitted);

    const key = randomUUID();
    const copy = await notificationApi.copyNotification(draft.id, key);
    const repeatedCopy = await notificationApi.copyNotification(draft.id, key);
    expect(copy.id).not.toBe(draft.id);
    expect(repeatedCopy.id).toBe(copy.id);
    expect(copy.status).toBe(fulfilmentStatuses.draft);

    const deleted = await notificationApi.softDeleteNotification(copy.id);
    const repeatedDelete = await notificationApi.softDeleteNotification(copy.id);
    expect(deleted.status).toBe(fulfilmentStatuses.deleted);
    expect(repeatedDelete.status).toBe(fulfilmentStatuses.deleted);
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
