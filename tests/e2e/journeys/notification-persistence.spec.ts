import { test, expect } from '@fixtures';
import { defaultJourneyOptions } from '@flows/journeys';
import { MongoDbClient } from '@domain/clients/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';

test.describe('Notification persistence', () => {
  test(
    'persists notification to database (after full journey completion*)',
    { tag: ['@compose', '@integration', '@mongodb'] },
    async ({ journeys, pages }) => {
      await journeys.toAdditionalDetails();
      const referenceNumber = await pages.additionalDetails.notificationId.textContent();
      const defaults = defaultJourneyOptions;
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
        await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: 5_000 }).toBe(1);

        const records = await collection.find({ referenceNumber }).toArray();
        const [record] = records;
        const [commodityComplement] = record.commodity.commodityComplement;
        const persistedSpecies = commodityComplement.species.find((species) => species.text === defaults.species);

        expect(records).toHaveLength(1);
        expect(record.referenceNumber).toBe(referenceNumber);
        expect(record.origin.countryCode).toBe(defaults.countryCode);
        expect(record.origin.requiresRegionCode).toBe('no');
        expect(record.commodity.name).toBe(defaults.commodityCode);
        expect(commodityComplement.typeOfCommodity).toBe(defaults.commodityType);
        expect(persistedSpecies).toBeDefined();
        expect(persistedSpecies?.text).toBe(defaults.species);
        expect(record.reasonForImport).toBe(defaults.importReason);
        expect(persistedSpecies?.noOfAnimals).toBe(defaults.numberOfAnimals);
        expect(persistedSpecies?.noOfPackages).toBe(defaults.numberOfPackages);
        // TODO: update to compute totals when full journey is implemented
        expect(commodityComplement.totalNoOfAnimals).toBe(defaults.numberOfAnimals);
        expect(commodityComplement.totalNoOfPackages).toBe(defaults.numberOfPackages);
      } finally {
        await client.close();
      }
    },
  );
});
