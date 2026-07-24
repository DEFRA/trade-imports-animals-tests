import { expect, test } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { ObjectId } from 'mongodb';
import { skipIfCdpEnvironment, isComposeEnvironment } from '@utils/playwright/environment';
import { seedNotifications } from '@flows/api-journey';

test.describe('Notifications (admin)', () => {
  test.beforeEach(async ({ adminNavigation }) => {
    await adminNavigation.toNotifications();
  });

  test('allows deleting a notification by reference number', { tag: '@smoke' }, async ({ apiJourney, journeyContext, pages }) => {
    await apiJourney.createSubmittedNotification();
    const referenceNumber = journeyContext.referenceNumber;
    await pages.adminNotifications.open(false);

    await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
    await pages.adminNotifications.deleteByReferenceNumber();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');

    await pages.notificationDashboard.open();
    await pages.notificationDashboard.searchForReference(referenceNumber);
    await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
  });

  test('allows cancelling checkbox deletion and keeps notification visible', async ({ apiJourney, journeyContext, pages }) => {
    await apiJourney.createSubmittedNotification();
    const referenceNumber = journeyContext.referenceNumber;
    await pages.adminNotifications.open(false);

    await pages.adminNotifications.findRowByReference(referenceNumber);
    await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
    await pages.adminNotifications.btnDelete.click();
    await pages.adminNotifications.btnCancel.click();
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();
  });

  test('allows deleting a notification by checkbox', async ({ apiJourney, journeyContext, pages }) => {
    await apiJourney.createSubmittedNotification();
    const referenceNumber = journeyContext.referenceNumber;
    await pages.adminNotifications.open(false);

    await test.step('delete notification by checkbox', async () => {
      await pages.adminNotifications.findRowByReference(referenceNumber);
      await pages.adminNotifications.checkboxNotificationByReference(referenceNumber).check();
      await pages.adminNotifications.btnDelete.click();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertSuccess).toContainText('Notifications deleted successfully. Redirecting in 3 seconds...');

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(0);
    });

    await test.step('writes a successful delete audit record for one notification delete', async (step) => {
      step.skip(!isComposeEnvironment(), 'persistence checked only in the docker compose stack');

      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const docs = await collection
          .find({
            notificationReferenceNumbers: referenceNumber,
          })
          .toArray();

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

  test.describe('destructive select-all delete', () => {
    test.describe.configure({ mode: 'default' });

    // TODO: deletes the whole page of notifications — unsafe under parallel runs.
    test.skip('allows deleting all current-page notifications by select all', { tag: '@compose' }, async ({ pages }) => {
      skipIfCdpEnvironment('Compose/local only: destructive (deletes the current page of notifications); never run on CDP environments.');

      await seedNotifications(4);
      await pages.adminNotifications.open(false);

      const currentPageRefs = await pages.adminNotifications.currentPageReferences();
      const expectedDeletes = currentPageRefs.length;
      let pageOneReference = '';

      await test.step('select all deletes only the current page', async () => {
        expect(await pages.adminNotifications.getTotalElements()).toBeGreaterThanOrEqual(4);

        expect(currentPageRefs.length).toBeGreaterThan(0);
        pageOneReference = currentPageRefs[0];

        await pages.adminNotifications.checkBoxSelectAll.check();
        await pages.adminNotifications.btnDelete.click();
        await pages.adminNotifications.btnConfirm.click();
        await expect(pages.adminNotifications.alertSuccess).toContainText(
          'Notifications deleted successfully. Redirecting in 3 seconds...',
        );
      });

      await test.step('writes a successful delete audit record covering a page-1 reference', async () => {
        const client = new MongoDbClient();

        try {
          await client.connect();
          const auditCollection = client.collection('trade-imports-animals-backend', 'audit');
          const docs = await auditCollection
            .find({
              action: 'DELETE_NOTIFICATIONS',
              notificationReferenceNumbers: pageOneReference,
            })
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
  });

  test('does not allow deleting a notification by invalid reference number', async ({ pages }) => {
    const randomId = new ObjectId().toString();
    const invalidReference = `EXIST.NON.2026.${randomId}`;

    await test.step('attempt delete by invalid reference number shows an error', async () => {
      await pages.adminNotifications.inputReferenceNumber.fill(invalidReference);
      await pages.adminNotifications.deleteByReferenceNumber();
      await pages.adminNotifications.btnConfirm.click();
      await expect(pages.adminNotifications.alertImportant).toContainText(
        'There was a problem deleting the notifications. Please try again.',
      );
    });

    await test.step('writes a failed delete audit record for one notification delete', async (step) => {
      step.skip(!isComposeEnvironment(), 'persistence checked only in the docker compose stack');

      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        const docs = await collection
          .find({
            notificationReferenceNumbers: invalidReference,
          })
          .toArray();

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
