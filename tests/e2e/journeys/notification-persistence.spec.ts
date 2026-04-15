import { test, expect } from '@fixtures';
import { defaultJourneyOptions } from '@flows/journeys';
import { MongoDbClient } from '@domain/clients/mongodb-client';
import { yesNoValues } from '@domain/types/yes-no-values';
import { type NotificationDocument } from '@domain/models/db/notification-document';

test.describe('Notification persistence', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test('persists notification with defaults (after full journey completion*)', async ({ journeys, pages }) => {
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
      const subdocFirstSpecies = subdocCommodityComplement.species.find((species) => species.text === defaults.species[0]);
      const subdocSecondSpecies = subdocCommodityComplement.species.find((species) => species.text === defaults.species[1]);

      expect(docs).toHaveLength(1);
      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.origin.countryCode).toBe(defaults.countryCode);
      expect(doc.origin.requiresRegionCode).toBe(yesNoValues.no.toLowerCase());
      expect(doc.origin.internalReference).toBe(undefined);
      expect(doc.commodity.name).toBe(defaults.commodityCode);
      expect(subdocCommodityComplement.typeOfCommodity).toBe(defaults.commodityType);
      expect(subdocFirstSpecies).toBeDefined();
      expect(subdocFirstSpecies?.text).toBe(defaults.species[0]);
      expect(subdocSecondSpecies).toBeDefined();
      expect(subdocSecondSpecies?.text).toBe(defaults.species[1]);
      expect(doc.reasonForImport).toBe(defaults.importReason);
      expect(subdocFirstSpecies?.noOfAnimals).toBe(defaults.noOfAnimals[0]);
      expect(subdocFirstSpecies?.noOfPackages).toBe(defaults.noOfPackages[0]);
      expect(subdocSecondSpecies?.noOfAnimals).toBe(defaults.noOfAnimals[1]);
      expect(subdocSecondSpecies?.noOfPackages).toBe(defaults.noOfPackages[1]);
      expect(subdocCommodityComplement.totalNoOfAnimals).toBe(defaults.noOfAnimals[0] + defaults.noOfAnimals[1]);
      expect(subdocCommodityComplement.totalNoOfPackages).toBe(defaults.noOfPackages[0] + defaults.noOfPackages[1]);
      expect(doc.additionalDetails.certifiedFor).toBe(defaults.certificationPurpose);
      expect(doc.additionalDetails.unweanedAnimals).toBe(yesNoValues.no.toLowerCase());
    } finally {
      await client.close();
    }
  });

  test('persists notification with defaults overidden (after full journey completion*)', async ({ journeys, pages }) => {
    const options = {
      ...defaultJourneyOptions,
      requiresRegionCode: yesNoValues.yes,
      internalReference: 'AnimalsTesting123',
      unweanedAnimals: yesNoValues.yes,
    };

    await journeys.toAccompanyingDocuments(options);
    const referenceNumber = await pages.additionalDetails.notificationId.textContent();
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: 5_000 }).toBe(1);

      const docs = await collection.find({ referenceNumber }).toArray();
      const [doc] = docs;

      expect(docs).toHaveLength(1);
      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.origin.requiresRegionCode).toBe(options.requiresRegionCode.toLowerCase());
      expect(doc.origin.internalReference).toBe(options.internalReference);
      expect(doc.additionalDetails.unweanedAnimals).toBe(options.unweanedAnimals.toLowerCase());
    } finally {
      await client.close();
    }
  });
});
