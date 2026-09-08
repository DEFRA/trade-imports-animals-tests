import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * Frontend-driven seeding, proved from the admin project on purpose.
 *
 * The obstacle it has to clear is that auth state is minted per project: this
 * spec's own browser session is an admin session on :3001, and several seeding
 * specs run here. Proving it on the e2e project would prove nothing, because
 * there the project session already is a frontend session.
 *
 * These assert the stored document, not the response, because an empty
 * notification document is exactly the failure being designed out.
 */
test.describe('Frontend seed context', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the seed proof asserts on Mongo directly, which only the compose stack exposes');
  });

  test('seeds an origin answer into the notification document from an admin-project spec', async ({ frontendForms }) => {
    const created = await frontendForms.postForm('/notifications');
    expect(created).toMatch(/^\/notifications\/[^/]+\/origin$/);

    const referenceNumber = created.split('/')[2];
    await frontendForms.postForm(`/notifications/${referenceNumber}/origin`, {
      countryOfOrigin: 'FR',
      regionOfOriginCodeRequirement: 'no',
      regionOfOriginCodeSuffix: '',
      internalReferenceNumber: 'Imports456GB',
    });

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      // The document, not the fulfilments blob: seeding straight to the backend
      // wrote the blob and left this null.
      expect(doc.notification.origin).toEqual({
        countryCode: 'FR',
        requiresRegionCode: 'no',
        internalReference: 'Imports456GB',
      });
      expect(doc.fulfilments?.length).toBeGreaterThan(0);
    } finally {
      await client.close();
    }
  });

  test('refuses a page the frontend rejected, rather than seeding half a notification', async ({ frontendForms }) => {
    const created = await frontendForms.postForm('/notifications');
    const referenceNumber = created.split('/')[2];

    // Not a country on the list, so the page re-renders with an error summary
    // instead of saving. A seeder that read that as success would leave a
    // notification whose origin was never answered.
    await expect(frontendForms.postForm(`/notifications/${referenceNumber}/origin`, { countryOfOrigin: 'Narnia' })).rejects.toThrow(
      /responded 400/,
    );
  });

  test('seeds a complete journey into every section of the notification document', async ({ seededJourney, addressBookApi }) => {
    const consignor = await addressBookApi.findByName('Astra Rosales');
    const placeOfOrigin = await addressBookApi.findByName('Origin Farm');

    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      const { notification } = doc;
      const [complement] = notification.commodity.commodityComplement;
      const [species] = complement.species;

      expect(doc.status).toBe('DRAFT');
      expect(notification.origin.countryCode).toBe('FR');
      expect(species.earTag).toBe('UK123456789012');
      expect(complement.totalNoOfAnimals).toBe(1);
      expect(notification.reasonForImport).toBe('internalMarket');
      expect(notification.additionalDetails.unweanedAnimals).toBe('no');
      // A referenced party keeps only the id; the frontend resolves the record
      // on read. An inline one is copied, and the picker shaped it — which is
      // the shaping this seeding no longer has to reproduce.
      expect(notification.consignor?.addressId).toBe(consignor.id);
      expect(notification.placeOfOrigin?.addressId).toBeUndefined();
      expect(notification.placeOfOrigin?.address?.postcode).toBe(placeOfOrigin.postcode);
      // Typed with slashes, stored without them — the frontend's own
      // normalisation, which is the point of letting it do the saving.
      expect(notification.cphNumber).toBe('123456789');
      expect(notification.transport.portOfEntry).toBe('GB ABD');
      expect(notification.transport.arrivalDate).toBeDefined();
      expect(notification.transport.transporter?.approvalNumber).toBe('ES-T2-45001294');
      expect(notification.consignment?.name).toBe('Animal and Plant Health Agency');
    } finally {
      await client.close();
    }
  });
});
