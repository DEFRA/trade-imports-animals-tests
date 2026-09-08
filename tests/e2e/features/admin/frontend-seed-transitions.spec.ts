import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMISSION_DELETED = 'uk.gov.defra.imports.notification.NotificationSubmissionDeleted';
const aggregateIdFor = (referenceNumber: string): string => `Imports.Notification.GBN-AG.${referenceNumber}`;
const shortType = (eventType: string): string => eventType.split('.').pop() ?? eventType;

/**
 * Transitions go through the frontend too, so a seeded notification carries a
 * real actor and the real event sequence rather than a stand-in.
 *
 * Seeding straight to the backend sent no actor at all, and the seeded
 * notifications had no parties for the missing actor to matter to. As soon as
 * seeding produces realistic parties, cancel-amend and soft-delete fail without
 * one: "Cannot resolve address-book parties for outbox transmission:
 * organisation id is required".
 */
test.describe('Seeded notification transitions', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('carries an actor and a populated event through submit, amend and cancel', async ({ seededJourney }) => {
    test.slow();
    const referenceNumber = await seededJourney.createSubmittedNotification();
    await seededJourney.amend(referenceNumber);
    await seededJourney.cancelAmend(referenceNumber);

    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      const events = (): Promise<OutboxEventDocument[]> => collection.find({ aggregateId }).sort({ aggregateVersion: 1 }).toArray();

      await expect
        .poll(async () => (await events()).map((event) => shortType(event.eventType)).filter((type) => type !== 'NotificationEdited'), {
          timeout: timeouts.long,
        })
        .toEqual(['NotificationCreated', 'NotificationSubmitted', 'NotificationAmendmentRequested', 'NotificationAmendmentCancelled']);

      const written = await events();
      // Every transition, not just the first: the actor is built from the
      // session on each one, and cancel-amend was the call that lacked it.
      for (const event of written) {
        expect(event.actor?.organisationId, `${shortType(event.eventType)} carries no actor`).toBeTruthy();
      }

      // The submitted event, populated. Seeding to the backend left every one
      // of these null, and nothing noticed because the notification view reads
      // the fulfilments blob rather than the document.
      const submitted = written.find((event) => shortType(event.eventType) === 'NotificationSubmitted');
      const consignment = submitted?.data.specifiedConsignment;
      expect(consignment?.consignorParty).toBeTruthy();
      expect(consignment?.consigneeParty).toBeTruthy();
      expect(consignment?.originCountry).toBeTruthy();
      expect(consignment?.unloadingBaseportLocation).toBeTruthy();
      expect(consignment?.includedConsignmentItem?.length).toBeGreaterThan(0);
    } finally {
      await client.close();
    }
  });

  test('soft-deletes a submitted notification through the frontend', async ({ seededJourney }) => {
    test.slow();
    const referenceNumber = await seededJourney.createSubmittedNotification();
    await seededJourney.softDelete(referenceNumber);

    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');

      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMISSION_DELETED }), { timeout: timeouts.long })
        .toBe(1);

      const [deletion] = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMISSION_DELETED }).toArray();
      expect(deletion.actor?.organisationId).toBeTruthy();
    } finally {
      await client.close();
    }
  });
});
