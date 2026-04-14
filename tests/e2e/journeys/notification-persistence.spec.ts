import { test, expect } from '@fixtures';
import { defaultJourneyOptions } from '@flows/journeys';
import { MongoDbClient } from '@domain/clients/mongodb-client';
import { yesNoValues } from '@domain/types/yes-no-values';
import { type NotificationDocument } from '@domain/models/db/notification-document';

test.describe('Notification persistence', () => {
  test(
    'persists notification to database (after full journey completion*)',
    { tag: ['@compose', '@integration', '@mongodb'] },
    async ({ journeys, pages }) => {
      await journeys.toAccompanyingDocuments();
      const referenceNumber = await pages.additionalDetails.notificationId.textContent();
      const defaults = defaultJourneyOptions;
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
        await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: 5_000 }).toBe(1);

        const docs = await collection.find({ referenceNumber }).toArray();
        const [doc] = docs;
        const [subdocCommodityComplement] = doc.commodity.commodityComplement;
        const subdocSpecies = subdocCommodityComplement.species.find((species) => species.text === defaults.species);

        expect(docs).toHaveLength(1);
        expect(doc.referenceNumber).toBe(referenceNumber);
        expect(doc.origin.countryCode).toBe(defaults.countryCode);
        expect(doc.origin.requiresRegionCode).toBe(yesNoValues.no.toLowerCase());
        expect(doc.commodity.name).toBe(defaults.commodityCode);
        expect(subdocCommodityComplement.typeOfCommodity).toBe(defaults.commodityType);
        expect(subdocSpecies).toBeDefined();
        expect(subdocSpecies?.text).toBe(defaults.species);
        expect(doc.reasonForImport).toBe(defaults.importReason);
        expect(subdocSpecies?.noOfAnimals).toBe(defaults.noOfAnimals);
        expect(subdocSpecies?.noOfPackages).toBe(defaults.noOfPackages);
        // TODO: update to compute totals when full journey is implemented
        expect(subdocCommodityComplement.totalNoOfAnimals).toBe(defaults.noOfAnimals);
        expect(subdocCommodityComplement.totalNoOfPackages).toBe(defaults.noOfPackages);

        expect(doc.additionalDetails.certifiedFor).toBe(defaults.certificationPurpose);
        expect(doc.additionalDetails.unweanedAnimals).toBe(yesNoValues.no.toLowerCase());
      } finally {
        await client.close();
      }
    },
  );
});
