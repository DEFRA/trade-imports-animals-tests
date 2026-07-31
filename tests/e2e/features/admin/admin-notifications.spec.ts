import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { ObjectId } from 'mongodb';
import { skipIfCdpEnvironment } from '@utils/playwright/environment';

/** Integration seam: the admin operator UI over real notifications and audit records. */
test.describe('Notifications (admin)', { tag: ['@integration', '@mongodb'] }, () => {
  test.describe.configure({ mode: 'default' });

  test(
    'finds and deletes a submitted notification by reference number',
    { tag: '@smoke' },
    async ({ journey, journeyContext, adminNavigation, pages }) => {
      test.slow();
      await journey.submitNotification();
      const referenceNumber = journeyContext.journeyId;

      await adminNavigation.toNotifications();
      await pages.adminNotifications.findRowByReference(referenceNumber);
      await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();

      await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
      await pages.adminNotifications.deleteByReferenceNumber();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');

      await expect
        .poll(async () => pages.adminNotifications.tableRowByReference(referenceNumber).isVisible(), {
          timeout: timeouts.medium,
        })
        .toBe(false);

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    },
  );

  test('cancelling checkbox deletion keeps the notification visible', async ({ apiJourney, adminNavigation, pages }) => {
    test.slow();
    const { id: referenceNumber } = await apiJourney.createSubmittedNotification();

    await adminNavigation.toNotifications();
    await pages.adminNotifications.findRowByReference(referenceNumber);
    await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
    await pages.adminNotifications.btnDelete.click();
    await pages.adminNotifications.btnCancel.click();
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();
  });

  test('deletes a notification by checkbox', async ({ apiJourney, adminNavigation, pages }) => {
    test.slow();
    const { id: referenceNumber } = await apiJourney.createSubmittedNotification();

    await adminNavigation.toNotifications();

    await test.step('delete notification by checkbox', async () => {
      await pages.adminNotifications.findRowByReference(referenceNumber);
      await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
      await expect
        .poll(async () => pages.adminNotifications.tableRowByReference(referenceNumber).isVisible(), {
          timeout: timeouts.medium,
        })
        .toBe(false);

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    });

    await test.step('writes a successful delete audit record for one notification delete', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');
        const docs = await collection.find({ notificationReferenceNumbers: referenceNumber }).toArray();

        expect(docs).toHaveLength(1);
        expect(String(docs[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(docs[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(docs[0].result).toBe('SUCCESS');
        expect(String(docs[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(docs[0].numberOfNotifications).toBe(1);
        expect(docs[0].notificationReferenceNumbers).toEqual([referenceNumber]);
        expect(docs[0].traceId).toBe('test-trace-id');
        expect(docs[0].userId).toBe('2100010101');
      } finally {
        await client.close();
      }
    });
  });

  test.skip('deletes all current-page notifications by select all', { tag: '@compose' }, async ({ apiJourney, adminNavigation, pages }) => {
    skipIfCdpEnvironment('Compose/local only: destructive (deletes the current page of notifications).');
    test.slow();

    await apiJourney.createFullNotification();
    await apiJourney.createFullNotification();
    await apiJourney.createFullNotification();
    await apiJourney.createFullNotification();

    await adminNavigation.toNotifications();
    await expect(pages.adminNotifications.heading).toBeVisible();

    const currentPageRefs = await pages.adminNotifications.currentPageReferences();
    const expectedDeletes = currentPageRefs.length;
    expect(currentPageRefs.length).toBeGreaterThan(0);
    const pageOneReference = currentPageRefs[0];

    await test.step('select all deletes only the current page', async () => {
      await pages.adminNotifications.checkBoxSelectAll.check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');
    });

    await test.step('writes a successful delete audit record covering a page-1 reference', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const auditCollection = client.collection('trade-imports-animals-backend', 'audit');
        const docs = await auditCollection
          .find({ action: 'DELETE_NOTIFICATIONS', notificationReferenceNumbers: pageOneReference })
          .toArray();

        expect(docs).toHaveLength(1);
        expect(String(docs[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(docs[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(docs[0].result).toBe('SUCCESS');
        expect(String(docs[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(docs[0].numberOfNotifications).toBe(expectedDeletes);
        expect(docs[0].notificationReferenceNumbers).toContain(pageOneReference);
        expect(docs[0].traceId).toBe('test-trace-id');
        expect(docs[0].userId).toBe('2100010101');
      } finally {
        await client.close();
      }
    });
  });

  test('does not allow deleting a notification by invalid reference number', async ({ adminNavigation, pages }) => {
    test.slow();
    const randomId = new ObjectId().toString();
    const invalidReference = `EXIST.NON.2026.${randomId}`;

    await adminNavigation.toNotifications();

    await test.step('attempt delete by invalid reference number shows an error', async () => {
      await pages.adminNotifications.inputReferenceNumber.fill(invalidReference);
      await pages.adminNotifications.deleteByReferenceNumber();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertImportant).toContainText(
        'There was a problem deleting the notifications. Please try again.',
      );
    });

    await test.step('writes a failed delete audit record for one notification delete', async () => {
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');
        const docs = await collection.find({ notificationReferenceNumbers: invalidReference }).toArray();

        expect(docs).toHaveLength(1);
        expect(String(docs[0]._id)).toMatch(/^[a-f0-9]{24}$/i);
        expect(docs[0].action).toBe('DELETE_NOTIFICATIONS');
        expect(docs[0].result).toBe('FAILURE');
        expect(String(docs[0].timestamp)).toMatch(/\b\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\b/);
        expect(docs[0].numberOfNotifications).toBe(1);
        expect(docs[0].notificationReferenceNumbers).toEqual([invalidReference]);
        expect(docs[0].traceId).toBe('test-trace-id');
        expect(docs[0].userId).toBe('2100010101');
      } finally {
        await client.close();
      }
    });
  });
});
