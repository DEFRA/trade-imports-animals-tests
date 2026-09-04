import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { countryCodes } from '@domain/constants/country-codes';
import {
  defaultJourneyOptions,
  CONSIGNOR_NAME,
  TRANSPORT_DOCUMENT_REFERENCE,
  TRANSPORT_IDENTIFICATION,
} from '@domain/constants/journey-options';
import { meansOfTransport } from '@domain/constants/means-of-transport';
import { type OutboxEventActor, type OutboxEventDocument } from '@domain/models/db/outbox-event-document';
import { timeouts } from '@config/timeouts';
import { users } from '@config/users';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const NOTIFICATION_SUBMITTED = 'uk.gov.defra.imports.notification.NotificationSubmitted';
const POINT_OF_ENTRY = 'GB ABD';
// The GBN-AG mode code the backend maps each means of transport onto
// (LogisticsTransportMovement.modeCode).
const MODE_CODES: Record<string, number> = { VESSEL: 1, RAILWAY: 2, ROAD_VEHICLE: 3, AIRPLANE: 4 };
const TRANSITED_COUNTRY_CODES = [countryCodes.eu.belgium.value, countryCodes.eu.france.value];
const EXPECTED_ACTOR: OutboxEventActor = {
  id: users.andrew.crn,
  source: 'dynamics-contact',
  userType: 'B2C',
  displayName: users.andrew.displayName,
  organisationId: users.andrew.organisationId,
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

test.describe('Notification outbox event', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('outbox assertions read Mongo directly, which only the compose stack exposes');
  });

  test('records a NotificationSubmitted outbox event on UI submission', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const aggregateId = aggregateIdFor(referenceNumber);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const docs = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMITTED }).toArray();
      const [doc] = docs;
      const data = doc.data;
      const statusChanges = doc.statusChanges ?? [];

      expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(doc.aggregateId).toBe(aggregateId);
      expect(doc.aggregateType).toBe('Notification');
      expect(doc.subType).toBe('GBN-AG');
      expect(doc.eventType).toBe(NOTIFICATION_SUBMITTED);
      expect(doc.timestamp).toBeInstanceOf(Date);
      expect(doc.metadata.schemaVersion).toBe('1');
      expect(doc.metadata.correlationId).toBeDefined();
      expect(data.$model).toBe('defra/certificate-internal/1');
      expect(data.$type).toBe('gbn-ag');
      expect(data.exchangedDocument.identifier).toBe(referenceNumber);
      expect(data.exchangedDocument.notificationStatusCode).toBe('SUBMITTED');
      expect(data.specifiedConsignment.consignorParty?.name).toBe(CONSIGNOR_NAME);
      expect(data.specifiedConsignment.originCountry?.code?.value).toBe(defaultJourneyOptions.countryCode.value);
      expect(data.specifiedConsignment.unloadingBaseportLocation?.identifier).toBe(POINT_OF_ENTRY);
      expect(data.specifiedConsignment.includedConsignmentItem).toHaveLength(1);
      expect(actorWithNullableFields(doc.actor)).toEqual(EXPECTED_ACTOR);
      expect(statusChanges).toHaveLength(2);
      expect(statusChanges[0].status).toBe('DRAFT');
      expect(statusChanges[0].dateChanged).toEqual(expect.any(Date));
      expect(statusChanges[1].status).toBe('SUBMITTED');
      expect(statusChanges[1].dateChanged).toEqual(expect.any(Date));
      expect(actorWithNullableFields(statusChanges[1].actor)).toEqual(EXPECTED_ACTOR);
    } finally {
      await client.close();
    }
  });

  /**
   * Nothing else asserts the transport a trader declares, and none of it reaches
   * PIMS today: Mapper A (`mapper-a/sections/transport.js`) writes only
   * portOfEntry, arrivalDate and transporter to the document, and the backend
   * hardcodes null for `transitTradeCountry` and
   * `transportContractRelatedReferencedDocument`. Marked test.fail() until both
   * are fixed.
   */
  test.fail('carries the declared transport details on the submitted event', async ({ journey, journeyContext }) => {
    test.slow();
    await journey.submitNotification();
    const aggregateId = aggregateIdFor(journeyContext.journeyId);
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<OutboxEventDocument>('trade-imports-animals-backend', 'outbox');
      await expect
        .poll(() => collection.countDocuments({ aggregateId, eventType: NOTIFICATION_SUBMITTED }), { timeout: timeouts.long })
        .toBe(1);

      const [doc] = await collection.find({ aggregateId, eventType: NOTIFICATION_SUBMITTED }).toArray();
      const consignment = doc.data.specifiedConsignment;
      const [movement] = consignment.mainCarriageLogisticsTransportMovement ?? [];

      // Soft, so one run reports every lost field rather than stopping at the first.
      expect.soft(movement?.modeCode, 'means of transport').toBe(MODE_CODES[meansOfTransport.roadVehicle.value]);
      expect.soft(movement?.usedLogisticsTransportMeans?.name, 'transport identification').toBe(TRANSPORT_IDENTIFICATION);
      expect
        .soft(movement?.transportContractRelatedReferencedDocument?.[0]?.identifier, 'transport document reference')
        .toBe(TRANSPORT_DOCUMENT_REFERENCE);
      // Sorted: the journey declares France then Belgium, and no ordering
      // contract is defined for the emitted list.
      expect
        .soft(consignment.transitTradeCountry?.map((country) => country.code?.value).sort(), 'transited countries')
        .toEqual(TRANSITED_COUNTRY_CODES);
    } finally {
      await client.close();
    }
  });
});
