import { test, expect } from '@fixtures';
import { defaultJourneyOptions } from '@flows/journeys';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { yesNoValues } from '@domain/types/yes-no-values';
import { timeouts } from '@config/timeouts';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { EAR_TAG_PREFIX, PASSPORT_PREFIX, CONSIGNOR_NAME, CPH_NUMBER } from '@flows/journeys';
import { toUtcDate } from '@utils/date-utils';

test.describe('Notification persistence', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test('persists notification with defaults (after full journey completion*)', async ({ journeys, journeyContext }) => {
    await journeys.toTransporter();
    const referenceNumber = journeyContext.notificationId;
    const defaults = defaultJourneyOptions;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

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
      expect(subdocFirstSpecies?.earTag).toMatch(new RegExp(`^${EAR_TAG_PREFIX}`));
      expect(subdocFirstSpecies?.passport).toMatch(new RegExp(`^${PASSPORT_PREFIX}`));
      expect(subdocSecondSpecies?.noOfAnimals).toBe(defaults.noOfAnimals[1]);
      expect(subdocSecondSpecies?.noOfPackages).toBe(defaults.noOfPackages[1]);
      expect(subdocSecondSpecies?.earTag).toMatch(new RegExp(`^${EAR_TAG_PREFIX}`));
      expect(subdocSecondSpecies?.passport).toMatch(new RegExp(`^${PASSPORT_PREFIX}`));
      expect(subdocCommodityComplement.totalNoOfAnimals).toBe(defaults.noOfAnimals[0] + defaults.noOfAnimals[1]);
      expect(subdocCommodityComplement.totalNoOfPackages).toBe(defaults.noOfPackages[0] + defaults.noOfPackages[1]);
      expect(doc.additionalDetails.certifiedFor).toBe(defaults.certificationPurpose);
      expect(doc.additionalDetails.unweanedAnimals).toBe(yesNoValues.no.toLowerCase());
      expect(doc.consignor.name).toBe(CONSIGNOR_NAME);
      expect(doc.consignor.address.addressLine1).toBe('43 East Hague Extension');
      expect(doc.consignor.address.addressLine2).toBe('Delectus sitodio p. Laborum Odio tempor');
      expect(doc.consignor.address.addressLine3).toBe('Quasoccaecat ut ear, 30055');
      expect(doc.consignor.address.country).toBe('Switzerland');
      expect(doc.cphNumber).toBe(CPH_NUMBER);
      expect(doc.transport.portOfEntry).toBe(defaults.pointOfEntry);
      const expectedArrivalDate = toUtcDate(defaults.arrivalDate);
      expect(doc.transport.arrivalDate.getTime()).toBe(expectedArrivalDate.getTime());
    } finally {
      await client.close();
    }
  });

  test('persists notification with defaults overidden (after full journey completion*)', async ({ journeys, journeyContext }) => {
    const options = {
      ...defaultJourneyOptions,
      requiresRegionCode: yesNoValues.yes,
      internalReference: 'AnimalsTesting123',
      unweanedAnimals: yesNoValues.yes,
    };

    await journeys.toEntryPoint(options);
    const referenceNumber = journeyContext.notificationId;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

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
