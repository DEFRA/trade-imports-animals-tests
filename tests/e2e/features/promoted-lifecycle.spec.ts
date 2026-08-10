import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import { notificationFulfilmentsStatuses } from '@domain/models/api/notification-fulfilments';
import { notificationStatuses } from '@domain/models/api/notification';

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

    await notificationApi.saveNotification(id, {
      origin: { countryCode: 'FR', requiresRegionCode: 'yes', internalReference: 'INTERNAL-REF-1' },
      commodity: {
        name: 'Live bovine animals',
        commodityComplement: [
          {
            typeOfCommodity: 'LIVE',
            totalNoOfAnimals: 10,
            totalNoOfPackages: 5,
            species: [{ value: '1148346', text: 'Bos taurus', noOfAnimals: 10, noOfPackages: 5 }],
          },
        ],
      },
      transport: { portOfEntry: 'GBFXT', arrivalDate: '2026-09-01' },
      consignor: { name: 'Consignor Ltd', address: { addressLine1: '1 Farm Road', city: 'Hamburg', country: 'DE' } },
      consignee: { name: 'Consignee Ltd', address: { addressLine1: '2 Market Street', city: 'Leeds', country: 'GB' } },
    });

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

    // One Idempotency-Key-guarded call writes both aggregates at the copy's reference.
    const key = randomUUID();
    const source = await notificationApi.getNotification(id);
    const copiedNotificationFulfilments = await notificationApi.copyNotificationFulfilments(id, key);
    expect(copiedNotificationFulfilments.id).not.toBe(id);
    expect(copiedNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.draft);

    const copiedNotification = await notificationApi.getNotification(copiedNotificationFulfilments.id);
    expect(copiedNotification.referenceNumber).toBe(copiedNotificationFulfilments.id);
    expect(copiedNotification.status).toBe(notificationStatuses.draft);
    expect(copiedNotification.origin).toEqual(source.origin);
    expect(copiedNotification.commodity).toEqual(source.commodity);
    expect(copiedNotification.transport).toEqual(source.transport);
    expect(copiedNotification.consignor).toEqual(source.consignor);
    expect(copiedNotification.consignee).toEqual(source.consignee);
    expect(copiedNotification.origin?.internalReference).toBe('INTERNAL-REF-1');
    expect(copiedNotification.transport?.arrivalDate).toBeTruthy();

    const repeatedCopy = await notificationApi.copyNotificationFulfilments(id, key);
    expect(repeatedCopy.id).toBe(copiedNotificationFulfilments.id);
    expect(await notificationApi.getNotification(repeatedCopy.id)).toEqual(copiedNotification);

    // Soft-delete both sides; both are idempotent.
    const deletedNotificationFulfilments = await notificationApi.softDeleteNotificationFulfilments(id);
    const deletedNotification = await notificationApi.softDeleteNotification(id);
    expect(deletedNotificationFulfilments.status).toBe(notificationFulfilmentsStatuses.deleted);
    expect(deletedNotification.status).toBe(notificationStatuses.deleted);

    const repeatDelete = await notificationApi.softDeleteNotificationFulfilments(id);
    expect(repeatDelete.status).toBe(notificationFulfilmentsStatuses.deleted);
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
