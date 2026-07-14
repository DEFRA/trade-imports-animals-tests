import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { TestDataHelper } from '@utils/test-data/test-data-helper';
import { CONTACT_ADDRESS_NAME, TRANSPORTER_NAME } from '@flows/journeys';
import { timeouts } from '@config/timeouts';
import { skipIfCdpEnvironment } from '@utils/playwright/environment';
import { toUtcDate } from '@utils/date-utils';
import type { NotificationDocument } from '@domain/models/db/notification-document';

const REFERENCE_NUMBER_PATTERN = /^GBN-AG-\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/;

test.describe('TestDataHelper', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(() => {
    skipIfCdpEnvironment('backend API reachability from CDP test runners is unverified');
  });

  test('full notification: when created, backend mints reference and stores every section as DRAFT', async () => {
    const { referenceNumber, identifiers } = await TestDataHelper.createFullNotification();

    expect(referenceNumber).toMatch(REFERENCE_NUMBER_PATTERN);

    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.status).toBe('DRAFT');
    expect(stored.origin?.countryCode).toBe(identifiers.countryCode);
    expect(stored.origin?.internalReference).toBe(identifiers.internalReference);
    expect(stored.commodity?.name).toBe(identifiers.commodityName);
    expect(stored.reasonForImport).toBe(identifiers.reasonForImport);
    expect(stored.additionalDetails?.certifiedFor).toBe(identifiers.certifiedFor);
    expect(stored.placeOfOrigin?.name).toBe(identifiers.placeOfOriginName);
    expect(stored.consignor?.name).toBe(identifiers.consignorName);
    expect(stored.consignee?.name).toBe(identifiers.consigneeName);
    expect(stored.importer?.name).toBe(identifiers.importerName);
    expect(stored.destination?.name).toBe(identifiers.destinationName);
    expect(stored.consignment?.name).toBe(identifiers.consignmentContactName);
    expect(stored.cphNumber).toBe(identifiers.cphNumber);
    expect(stored.transport?.portOfEntry).toBe(identifiers.portOfEntry);
    expect(stored.transport?.arrivalDate).toBe(identifiers.arrivalDate);
    expect(stored.transport?.transporter?.name).toBe(identifiers.transporterName);
    expect(stored.transport?.transporter?.approvalNumber).toBe(identifiers.transporterApprovalNumber);

    const complement = stored.commodity?.commodityComplement?.[0];
    expect(complement).toBeDefined();
    const storedAnimals = (complement?.species ?? []).map((species) => Number(species.noOfAnimals));
    const storedPackages = (complement?.species ?? []).map((species) => Number(species.noOfPackages));
    expect(complement?.totalNoOfAnimals).toBe(storedAnimals.reduce((total, count) => total + count, 0));
    expect(complement?.totalNoOfPackages).toBe(storedPackages.reduce((total, count) => total + count, 0));
    expect(identifiers.earTags.length).toBe(complement?.species.length);
    expect(identifiers.passports.length).toBe(complement?.species.length);
  });

  test('partial notification: when created through origin-of-import, only origin is populated', async () => {
    const { referenceNumber, identifiers } = await TestDataHelper.createPartialNotification({ throughPage: 'origin-of-import' });

    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.origin?.countryCode).toBe(identifiers.countryCode);
    expect(stored.commodity).toBeFalsy();
    expect(stored.reasonForImport).toBeFalsy();
    expect(stored.additionalDetails).toBeFalsy();
    expect(stored.consignor).toBeFalsy();
    expect(stored.cphNumber).toBeFalsy();
    expect(stored.transport).toBeFalsy();
    expect(stored.consignment).toBeFalsy();
  });

  test('partial notification: when created through import-reason, commodity pages are populated and later pages are not', async () => {
    const { referenceNumber, identifiers } = await TestDataHelper.createPartialNotification({ throughPage: 'import-reason' });

    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.origin?.countryCode).toBe(identifiers.countryCode);
    expect(stored.commodity?.name).toBe(identifiers.commodityName);
    expect(stored.commodity?.commodityComplement?.[0]?.species.length).toBe(identifiers.species.length);
    expect(stored.reasonForImport).toBe(identifiers.reasonForImport);
    expect(stored.additionalDetails).toBeFalsy();
    expect(stored.consignor).toBeFalsy();
    expect(stored.transport).toBeFalsy();
    expect(stored.consignment).toBeFalsy();
  });

  test('partial notification: when created through port-of-entry, transport has no transporter and consignment is empty', async () => {
    const { referenceNumber, identifiers } = await TestDataHelper.createPartialNotification({ throughPage: 'port-of-entry' });

    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.cphNumber).toBe(identifiers.cphNumber);
    expect(stored.transport?.portOfEntry).toBe(identifiers.portOfEntry);
    expect(stored.transport?.arrivalDate).toBe(identifiers.arrivalDate);
    expect(stored.transport?.transporter).toBeFalsy();
    expect(stored.consignment).toBeFalsy();
  });

  test('overrides: when a deep override is supplied, it lands in the stored notification and the rest stays generated', async () => {
    const { referenceNumber, identifiers } = await TestDataHelper.createFullNotification({
      origin: { internalReference: 'HELPER-TEST-1' },
    });

    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.origin?.internalReference).toBe('HELPER-TEST-1');
    expect(identifiers.internalReference).toBe('HELPER-TEST-1');
    expect(stored.commodity?.name).toBe(identifiers.commodityName);
  });

  test('submitted notification: when created, status is SUBMITTED', async () => {
    const { referenceNumber, notification } = await TestDataHelper.createSubmittedNotification();

    expect(notification.status).toBe('SUBMITTED');
    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.status).toBe('SUBMITTED');
  });

  test('amend notification: when created, status is AMEND', async () => {
    const { referenceNumber } = await TestDataHelper.createAmendNotification();

    const stored = await TestDataHelper.getNotification(referenceNumber);
    expect(stored.status).toBe('AMEND');
  });
});

test.describe('TestDataHelper persistence', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipIfCdpEnvironment('backend API reachability from CDP test runners is unverified');
  });

  test('full notification: when stored, Mongo holds numeric counts, lowercase yes/no and a midnight-UTC arrival date', async () => {
    const { referenceNumber, identifiers } = await TestDataHelper.createFullNotification();
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const doc = await collection.findOne({ referenceNumber });
      expect(doc?.origin.requiresRegionCode).toBe('no');
      expect(doc?.additionalDetails.unweanedAnimals).toBe('no');

      const speciesEntries = doc?.commodity.commodityComplement[0]?.species ?? [];
      expect(speciesEntries.length).toBe(identifiers.species.length);
      expect(speciesEntries.map((species) => typeof species.noOfAnimals)).toEqual(speciesEntries.map(() => 'number'));
      expect(speciesEntries.map((species) => typeof species.noOfPackages)).toEqual(speciesEntries.map(() => 'number'));

      const [year, month, day] = (identifiers.arrivalDate ?? '').split('-');
      const expectedArrivalDate = toUtcDate({ day, month, year });
      expect(doc?.transport.arrivalDate.getTime()).toBe(expectedArrivalDate.getTime());
    } finally {
      await client.close();
    }
  });
});

test.describe('TestDataHelper journey fidelity', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(() => {
    skipIfCdpEnvironment('backend API reachability from CDP test runners is unverified');
  });

  test('seeded early partial: when viewed in the frontend, the seeded commodity and species render', async ({ pages }) => {
    const { referenceNumber, identifiers } = await TestDataHelper.createPartialNotification({ throughPage: 'species-selection' });

    await pages.notificationView.open(referenceNumber);

    expect(identifiers.commodityName).toBeDefined();
    await expect(pages.notificationView.referenceNumberCaption).toHaveText(referenceNumber);
    await expect(pages.notificationView.commodityName).toHaveText(String(identifiers.commodityName));
    await expect(pages.notificationView.speciesRows).toHaveCount(identifiers.species.length);
  });

  test('seeded late partial: when resumed in the frontend, the journey completes through to submission', async ({ pages }) => {
    const { referenceNumber } = await TestDataHelper.createPartialNotification({ throughPage: 'port-of-entry' });

    await pages.notificationView.open(referenceNumber);
    await pages.notificationView.navigateToFrontend('/transporters');
    await pages.transporter.heading.waitFor();
    await pages.transporter.linkAddTransporter.click();
    await pages.transporterSelection.linkSelectTransporterByName(TRANSPORTER_NAME).click();
    await pages.transporter.btnSaveAndContinue.click();

    await pages.contactAddress.heading.waitFor();
    await pages.contactAddress.radioAddress(CONTACT_ADDRESS_NAME).click();
    await pages.contactAddress.btnSaveAndContinue.click();

    await pages.notificationView.heading.waitFor();
    await pages.notificationView.btnConfirmAndSubmit.click();
    await pages.declaration.heading.waitFor();
    await pages.declaration.checkboxDeclaration.click();
    await Promise.all([pages.page.waitForNavigation({ waitUntil: 'commit' }), pages.declaration.btnSubmitNotification.click()]);

    await expect
      .poll(async () => (await TestDataHelper.getNotification(referenceNumber)).status, { timeout: timeouts.short })
      .toBe('SUBMITTED');
  });
});
