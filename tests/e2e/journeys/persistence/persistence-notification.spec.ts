import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * Integration seam: real UI-create -> backend/Mongo persistence -> reload.
 *
 * The frontend Mapper A contract units (frontend repo) pin the exact payload shape; this seam proves the
 * round-trip end to end — the journey's answers survive to Mongo and the persisted notification re-renders.
 * Assertions cover a representative field per section rather than every field.
 */
test.describe('Notification persistence round-trip', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('draft notification persists as DRAFT up to declaration', async ({ journey, journeyContext }) => {
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
    journey,
    journeyContext,
    pages,
    addressBookApi,
  }) => {
    // Resolve linked ids from the once-seeded journey fixtures (API globalSetup),
    // not hard-coded Mongo ObjectIds — a role mix-up or the same id on every party
    // would otherwise pass if we only asserted "some string" (EUDPA-294 AC3).
    const consignor = await addressBookApi.findByName('Astra Rosales');
    const destination = await addressBookApi.findByName('Tech Imports Ltd');
    const placeOfOrigin = await addressBookApi.findByName('Origin Farm');
    const consignee = await addressBookApi.findByName('British Livestock Ltd');
    const importer = await addressBookApi.findByName('Import Co UK');
    const contact = await addressBookApi.findByName('Animal and Plant Health Agency');

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
      // Four roles are references — the id alone, with no copy of the address
      // beside it, so a later edit in the address book shows through.
      expect(doc.consignor).toEqual({ addressId: consignor.id });
      expect(doc.destination).toEqual({ addressId: destination.id });
      expect(doc.consignee).toEqual({ addressId: consignee.id });
      expect(doc.importer).toEqual({ addressId: importer.id });
      // Place of origin and the contact address are held as copies,
      // so they carry the details and never an addressId.
      expect(doc.placeOfOrigin).toMatchObject({ name: placeOfOrigin.name });
      expect(doc.placeOfOrigin.addressId).toBeUndefined();
      expect(doc.consignment).toMatchObject({ name: contact.name });
      expect(doc.consignment.addressId).toBeUndefined();
      expect(doc.cphNumber).toBe('123456789');
      expect(doc.transport.portOfEntry).toBe('GB ABD');
      expect(doc.transport.transporter?.name).toBe('García Livestock Transport SL');
      expect(doc.transport.transporter?.type).toBe('Commercial');
    } finally {
      await client.close();
    }

    await pages.notificationView.open(referenceNumber);
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
  });
});
