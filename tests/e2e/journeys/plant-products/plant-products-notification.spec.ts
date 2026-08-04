import { test, expect } from '@fixtures';
import { bcps } from '@domain/plant-products/constants/bcps';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { documentTypes } from '@domain/plant-products/constants/document-types';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { importPurposes } from '@domain/plant-products/constants/import-purposes';
import { meansOfTransport } from '@domain/plant-products/constants/means-of-transport';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
import { varieties } from '@domain/plant-products/constants/varieties';
import { SET_BASES } from '@page-objects/base/sets';

const notificationReference = /^GBN-PP-\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$/;
const apples = commodityCodes.otherApples;
const appleSpecies = eppoSpecies[apples.value][0];
const [mcIntoshRed, spartan, royalGala] = varieties[apples.value].MABSD;
const walkedAppleVarieties = [
  { variety: mcIntoshRed.value, varietyClass: 'CLASS_I' as const },
  { variety: spartan.value, varietyClass: 'CLASS_II' as const },
  { variety: royalGala.value, varietyClass: 'EXTRA_CLASS' as const },
];
const expectedAppleVarieties = [
  { variety: mcIntoshRed.value, varietyClass: 'CLASS_I' },
  { variety: spartan.value, varietyClass: 'CLASS_II' },
  { variety: royalGala.value, varietyClass: 'EXTRA_CLASS' },
];
const stubOrganisation = {
  operatorId: null,
  name: 'Stubbed organisation',
  telephone: null,
  email: null,
  address: {
    addressLine1: 'KAINOS SOFTWARE LTD',
    addressLine2: null,
    addressLine3: null,
    city: 'BELFAST',
    postcode: 'BT7 1NT',
    country: 'GB-NIR',
  },
};
const commodity = {
  commodityCode: apples.value,
  commodityDescription: apples.display,
  species: [
    {
      ...appleSpecies,
      varieties: walkedAppleVarieties,
    },
  ],
  details: {
    numberOfPackages: '4',
    packageType: packageTypes.box.value,
    quantity: '120',
    quantityType: quantityTypes.pieces.value,
    netWeight: '80',
    controlledAtmosphereContainer: false,
    intendedForFinalUsers: true,
    testAndTrial: false,
  },
};

const tomorrow = (): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

test(
  'submits every plant-products spoke through the real stack and persists the complete coded notification',
  { tag: ['@compose', '@integration'] },
  async ({ plantProductsJourney: journey, plantProductsPages: pages, plantProductsApi }) => {
    test.slow();
    const expectedArrivalDate = tomorrow();

    const reference = await journey.startNotification();
    await journey.completeMandatorySpokes({ commodities: { lines: [commodity] } });
    await journey.answerNominatedContacts();
    await journey.reviewAndSubmit();

    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.plantProducts}/notifications/${reference}/confirmation$`).test(url.pathname),
    );
    await expect(pages.confirmation.heading).toBeVisible();
    await expect(pages.confirmation.referenceNumber).toHaveText(notificationReference);
    const submittedReference = (await pages.confirmation.referenceNumber.textContent())?.trim();
    expect(submittedReference).toBe(reference);
    expect(submittedReference).toMatch(notificationReference);

    const persisted = await plantProductsApi.load(reference);
    expect(persisted).toMatchObject({
      referenceNumber: reference,
      chedType: 'CHEDPP',
      status: 'SUBMITTED',
      origin: {
        countryCode: 'FR',
        countryOfConsignmentCode: 'FR',
        internalReference: null,
      },
      reasonForImport: importPurposes.internalMarket.value,
      commodity: {
        name: null,
        inputMethod: 'MANUAL',
        commodityComplement: [
          {
            uniqueComplementId: null,
            commodityCode: apples.value,
            commodityDescription: apples.display,
            numberOfPackages: 4,
            packageType: packageTypes.box.value,
            quantity: 120,
            quantityType: quantityTypes.pieces.value,
            netWeight: 80,
            controlledAtmosphereContainer: false,
            finishedOrPropagated: null,
            intendedForFinalUsers: true,
            testAndTrial: false,
            species: [
              {
                ...appleSpecies,
              },
            ],
          },
        ],
      },
      additionalDetails: {
        totalGrossWeight: 100,
        grossVolume: null,
        grossVolumeUnit: null,
      },
      consignor: {
        operatorId: null,
        name: 'Consignor plant operator',
        telephone: '+44 7700 900123',
        email: 'consignor@example.com',
        address: {
          addressLine1: '1 Plant Street',
          addressLine2: 'Botanical Quarter',
          addressLine3: 'Glasshouse Estate',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'GB-ENG',
        },
      },
      consignee: null,
      importer: stubOrganisation,
      destination: stubOrganisation,
      responsiblePerson: {
        name: 'Responsible Person',
        email: 'responsible.person@example.com',
        telephone: '+44 7700 900124',
      },
      nominatedContacts: [],
      transport: {
        borderControlPost: bcps.heathrowAirport.value,
        inspectionPremises: null,
        meansOfTransport: meansOfTransport.roadVehicle.value,
        transportIdentification: 'AB12 CDE',
        transportDocumentReference: 'CMR-123',
        arrivalDate: expectedArrivalDate,
        arrivalTime: '14:50',
        usesContainers: false,
        containers: null,
      },
      goodsMovementServices: {
        commonTransitConvention: 'NO',
        movementReferenceNumber: null,
        usingGvms: false,
      },
      declaration: {
        agreed: true,
        declaredAt: expect.any(String),
      },
      accompanyingDocuments: [
        {
          documentType: documentTypes.phytosanitaryCertificate.value,
          documentReference: 'PP-DOC-1',
          issueDate: '2025-12-04',
        },
      ],
    });
    expect(persisted.commodity?.commodityComplement[0]?.species[0]?.varieties).toEqual(expectedAppleVarieties);
    expect(Number.isNaN(Date.parse(persisted.declaration?.declaredAt ?? ''))).toBe(false);
    expect(persisted.destination).toEqual(persisted.importer);

    await pages.confirmation.returnToDashboard.click();
    await expect(pages.page).toHaveURL((url) => url.pathname === SET_BASES.plantProducts);
    await pages.plantNotificationDashboard.searchForReference(reference);
    await expect(pages.page).toHaveURL(
      (url) => url.pathname === SET_BASES.plantProducts && url.searchParams.get('referenceNumber') === reference,
    );
    await expect(pages.plantNotificationDashboard.row(reference)).toContainText('Submitted');
  },
);
