import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { yesNoValues } from '@domain/constants/yes-no-values';
import { timeouts } from '@config/timeouts';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { meansOfTransport } from '@domain/constants/means-of-transport';
import {
  defaultJourneyOptions,
  EAR_TAG_PREFIX,
  PASSPORT_PREFIX,
  PLACE_OF_ORIGIN_NAME,
  CONSIGNOR_NAME,
  CONSIGNEE_NAME,
  IMPORTER_NAME,
  DESTINATION_NAME,
  CPH_NUMBER,
  TRANSPORTER_NAME,
  CONTACT_ADDRESS_NAME,
  TRANSITED_COUNTRIES,
} from '@domain/constants/journey-options';
import { toUtcDate } from '@utils/date-utils';

test.describe('Notification persistence', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test('persists notification as draft up to declaration', async ({ journey, journeyContext }) => {
    await journey.toDeclaration();
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
      expect(doc.status).toBe('DRAFT');
    } finally {
      await client.close();
    }
  });

  test('persists notification with defaults (after full journey completion*)', async ({ journey, journeyContext }) => {
    await journey.submitNotification();
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
      expect(String(doc._id)).toMatch(/^[a-f0-9]{24}$/i);
      expect(doc.referenceNumber).toBe(referenceNumber);
      expect(doc.origin.countryCode).toBe(defaults.countryCode.value);
      expect(doc.origin.requiresRegionCode).toBe(yesNoValues.no.toLowerCase());
      expect(doc.origin.internalReference).toBeUndefined();
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
      expect(doc.placeOfOrigin.name).toBe(PLACE_OF_ORIGIN_NAME);
      expect(doc.placeOfOrigin.address.addressLine1).toBe('1 Farm Lane');
      expect(doc.placeOfOrigin.address.country).toBe('Ireland');
      expect(doc.consignor?.name).toBe(CONSIGNOR_NAME);
      expect(doc.consignor?.address.addressLine1).toBe('43 East Hague Extension');
      expect(doc.consignor?.address.addressLine2).toBe('Delectus sitodio p. Laborum Odio tempor');
      expect(doc.consignor?.address.addressLine3).toBe('Quasoccaecat ut ear, 30055');
      expect(doc.consignor?.address.country).toBe('Switzerland');
      expect(doc.consignee.name).toBe(CONSIGNEE_NAME);
      expect(doc.consignee.address.addressLine1).toBe('10 Market Street');
      expect(doc.consignee.address.country).toBe('United Kingdom');
      expect(doc.importer.name).toBe(IMPORTER_NAME);
      expect(doc.importer.address.addressLine1).toBe('20 Trade Road');
      expect(doc.importer.address.country).toBe('United Kingdom');
      expect(doc.destination?.name).toBe(DESTINATION_NAME);
      expect(doc.destination?.address.addressLine1).toBe('643 Main Street');
      expect(doc.destination?.address.addressLine2).toBe('Birmingham G1 3AZ');
      expect(doc.destination?.address.addressLine3).toBeUndefined();
      expect(doc.destination?.address.country).toBe('United Kingdom');
      expect(doc.cphNumber).toBe(CPH_NUMBER);
      const expectedArrivalDate = toUtcDate(defaults.arrivalDate);
      expect(doc.transport.arrivalDate?.getTime()).toBe(expectedArrivalDate.getTime());
      expect(doc.transport.portOfEntry).toBe(defaults.pointOfEntry.value);
      expect(doc.transport.meansOfTransport).toBe(defaults.meansOfTransport.value);
      expect(doc.transport.transitedCountries).toBeUndefined();
      expect(doc.transport.transporter?.name).toBe(TRANSPORTER_NAME);
      expect(doc.transport.transporter?.address.addressLine1).toBe('43 East Hague Extension');
      expect(doc.transport.transporter?.address.addressLine2).toBe('Delectus sitodio p. Laborum Odio tempor');
      expect(doc.transport.transporter?.address.addressLine3).toBe('Quasoccaecat ut ear, 30055');
      expect(doc.transport.transporter?.address.country).toBe('Switzerland');
      expect(doc.transport.transporter?.approvalNumber).toBe('ES-T2-45001294');
      expect(doc.transport.transporter?.type).toBe('Commercial');
      expect(doc.consignment?.name).toBe(CONTACT_ADDRESS_NAME);
      expect(doc.consignment?.address.addressLine1).toBe('Woodham Lane');
      expect(doc.consignment?.address.addressLine2).toBe('New Haw');
      expect(doc.consignment?.address.addressLine3).toBe('Addlestone, KT15 3NB');
      expect(doc.consignment?.address.country).toBe('United Kingdom');
      expect(doc.status).toBe('SUBMITTED');
    } finally {
      await client.close();
    }
  });

  test('persists notification with defaults overidden (after full journey completion*)', async ({ journey, journeyContext }) => {
    const options = {
      ...defaultJourneyOptions,
      requiresRegionCode: yesNoValues.yes,
      internalReference: 'AnimalsTesting123',
      unweanedAnimals: yesNoValues.yes,
      meansOfTransport: meansOfTransport.railway,
      transportIdentification: 'Train 4521',
      transportDocumentReference: 'BILL-OF-LADING-001',
    };

    await journey.submitNotification(options);
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
      expect(doc.transport.transportIdentification).toBe(options.transportIdentification);
      expect(doc.transport.transportDocumentReference).toBe(options.transportDocumentReference);
      expect(doc.transport.transitedCountries).toEqual(TRANSITED_COUNTRIES.map((country) => country.value));
    } finally {
      await client.close();
    }
  });
});
