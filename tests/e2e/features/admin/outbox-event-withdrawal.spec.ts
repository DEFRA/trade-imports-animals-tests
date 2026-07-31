import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';

const NOTIFICATION_WITHDRAWN = 'uk.gov.defra.imports.notification.NotificationWithdrawn';
const EXPECTED_ACTOR: OutboxEventActor = {
  id: '2100010101',
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: 'Andrew Farmer',
  organisationId: '5900001',
  onBehalfOfOrganisationId: null,
};

const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;

const actorWithNullableFields = (actor?: OutboxEventActor | null): OutboxEventActor => ({
  id: actor?.id ?? null,
  source: actor?.source ?? null,
  userType: actor?.userType ?? null,
  displayName: actor?.displayName ?? null,
  organisationId: actor?.organisationId ?? null,
  onBehalfOfOrganisationId: actor?.onBehalfOfOrganisationId ?? null,
});

test.describe('Notification withdrawal outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test('records the authenticated actor and cumulative status changes on deletion', async ({
    journey,
    journeyContext,
    notificationActions,
  }) => {
    test.slow();
    await journey.submitNotification();
    await notificationActions.deleteNotification(journeyContext.journeyId);

    const aggregateId = aggregateIdFor(journeyContext.journeyId);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect.poll(() => collection.countDocuments({ aggregateId }), { timeout: timeouts.long }).toBe(2);

      const withdrawn = await collection.findOne({ aggregateId, eventType: NOTIFICATION_WITHDRAWN });
      const statusChanges = withdrawn?.statusChanges ?? [];

      expect(withdrawn).not.toBeNull();
      expect(withdrawn?.aggregateVersion).toBe(2);
      expect(withdrawn?.eventType).toBe(NOTIFICATION_WITHDRAWN);
      expect(actorWithNullableFields(withdrawn?.actor ?? null)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(2);
      expect(statusChanges.map(({ status }) => status)).toEqual(['SUBMITTED', 'DELETED']);
      expect(statusChanges.map(({ dateChanged }) => dateChanged)).toEqual([expect.any(Date), expect.any(Date)]);
      expect(statusChanges.map(({ actor }) => actorWithNullableFields(actor))).toEqual([EXPECTED_ACTOR, EXPECTED_ACTOR]);
    } finally {
      await client.close();
    }
  });

  test('does not write a withdrawn event when a draft is deleted', async ({ journey, journeyContext, notificationActions }) => {
    test.slow();
    await journey.startNotification();
    await notificationActions.deleteNotification(journeyContext.journeyId);

    const aggregateId = aggregateIdFor(journeyContext.journeyId);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_WITHDRAWN }), {
          timeout: timeouts.short,
        })
        .toBe(0);
    } finally {
      await client.close();
    }
  });
});
