import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/live-animals/models/db/notification-document';
import { timeouts } from '@config/timeouts';

/**
 * Integration seam: real UI-create -> backend/Mongo persistence -> reload.
 *
 * The frontend Mapper A contract units (frontend repo) pin the exact payload shape; this seam proves the
 * round-trip end to end — the journey's answers survive to Mongo and the persisted notification re-renders.
 * Assertions cover a representative field per section rather than every field.
 */
test.describe('Notification persistence round-trip', { tag: ['@integration', '@mongodb'] }, () => {
  test('draft notification persists as DRAFT up to declaration', async ({ liveAnimalsJourney: journey, journeyContext }) => {
    await journey.toDeclaration();
    const referenceNumber = journeyContext.journeyId;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('DRAFT');
    } finally {
      await client.close();
    }
  });

  test('submitted notification persists the journey answers and reloads read-only', async ({
    liveAnimalsJourney: journey,
    journeyContext,
    liveAnimalsPages: pages,
  }) => {
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const [complement] = doc.commodity.commodityComplement;
      const [species] = complement.species;

      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.status).toBe('SUBMITTED');
      expect(doc.origin.countryCode).toBe('FR');
      expect(doc.origin.requiresRegionCode).toBe('yes');
      expect(doc.origin.internalReference).toBe('Imports456GB');
      expect(doc.commodity.name).toBe('Cow');
      expect(species.text).toBe('Bos taurus');
      expect(species.earTag).toBe('UK123456789012');
      expect(complement.totalNoOfAnimals).toBe(1);
      expect(complement.totalNoOfPackages).toBe(5);
      expect(doc.reasonForImport).toBe('internalMarket');
      expect(doc.additionalDetails.certifiedFor).toBe('slaughter');
      expect(doc.additionalDetails.unweanedAnimals).toBe('no');
      expect(doc.placeOfOrigin.name).toBe('Origin Farm');
      expect(doc.consignor?.name).toBe('Astra Rosales');
      expect(doc.consignee.name).toBe('British Livestock Ltd');
      expect(doc.importer.name).toBe('Import Co UK');
      expect(doc.destination?.name).toBe('Tech Imports Ltd');
      expect(doc.cphNumber).toBe('123456789');
      expect(doc.transport.portOfEntry).toBe('GB ABD');
      expect(doc.transport.transporter?.name).toBe('García Livestock Transport SL');
      expect(doc.transport.transporter?.type).toBe('Commercial');
      expect(doc.consignment?.name).toBe('Animal and Plant Health Agency');
    } finally {
      await client.close();
    }

    await pages.notificationView.open(referenceNumber);
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
  });
});
