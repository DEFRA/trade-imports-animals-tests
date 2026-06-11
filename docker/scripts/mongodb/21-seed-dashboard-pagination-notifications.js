/**
 * Seeds additional notifications so the dashboard spans multiple pages locally.
 * Runs after 20-seed-notifications.js (page size is 25 in the backend).
 * Seeds through GBN-AG-26-000055 (55 total with 20-seed) for three dashboard pages.
 */

db = db.getSiblingDB('trade-imports-animals-backend');

const countryCodes = ['IE', 'FR', 'NL', 'DE'];
const commodityNames = ['Dog', 'Cow', 'Cat', 'Fish'];
const consignorNames = ['Astra Rosales', 'Laiterie du Nord SARL', 'Nordic Livestock BV', 'Bayer Agrar GmbH'];
const destinationNames = ['Tech Imports Ltd', 'Global Trading Co', 'Northern Foods PLC', 'Midlands Agri Ltd'];

function buildNotification(index) {
  const countryIndex = (index - 5) % countryCodes.length;
  const createdDay = 10 + ((index - 5) % 18);

  return {
    _id: ObjectId(`69c12f11cafe2026${String(index).padStart(8, '0')}`),
    referenceNumber: `GBN-AG-26-${String(index).padStart(6, '0')}`,
    origin: {
      countryCode: countryCodes[countryIndex],
      requiresRegionCode: countryIndex % 2 === 0 ? 'no' : 'yes',
    },
    commodity: {
      name: commodityNames[countryIndex],
      commodityComplement: [
        {
          typeOfCommodity: 'Domestic',
          totalNoOfAnimals: 10 + (index % 5),
          totalNoOfPackages: 12 + (index % 5),
          species: [
            {
              value: '1388624',
              text: 'Bos spp.',
              noOfAnimals: 10 + (index % 5),
              noOfPackages: 12 + (index % 5),
              earTag: `SEED${String(index).padStart(8, '0')}`,
              passport: `SEED-PASS-${String(index).padStart(6, '0')}`,
            },
          ],
        },
      ],
    },
    reasonForImport: 'internalMarket',
    additionalDetails: {
      certifiedFor: 'approvedBodies',
      unweanedAnimals: 'no',
    },
    consignor: {
      name: consignorNames[countryIndex],
      address: {
        addressLine1: `${index} Seed Street`,
        addressLine2: 'Pagination test data',
        country: 'France',
      },
    },
    destination: {
      name: destinationNames[countryIndex],
      address: {
        addressLine1: `${index} Import Road`,
        addressLine2: 'London',
        country: 'United Kingdom',
      },
    },
    cphNumber: String(100000000 + index),
    transport: {
      portOfEntry: 'ABERDEEN',
      arrivalDate: ISODate(`2026-06-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`),
      transporter: {
        name: 'Seed Livestock Transport',
        address: {
          addressLine1: '1 Transport Way',
          country: 'France',
        },
        approvalNumber: `SEED-T2-${String(index).padStart(8, '0')}`,
        type: 'Commercial',
      },
    },
    consignment: {
      contact: {
        name: 'Animal and Plant Health Agency',
        address: {
          addressLine1: 'Woodham Lane',
          addressLine2: 'New Haw',
          addressLine3: 'Addlestone, KT15 3NB',
          country: 'United Kingdom',
        },
      },
    },
    status: 'SUBMITTED',
    created: ISODate(`2026-03-${String(createdDay).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:00:00.000Z`),
    updated: ISODate(`2026-03-${String(createdDay).padStart(2, '0')}T${String(index % 24).padStart(2, '0')}:30:00.000Z`),
    _class: 'uk.gov.defra.trade.imports.animals.notification.Notification',
  };
}

const extraNotifications = [];
for (let index = 5; index <= 55; index += 1) {
  extraNotifications.push(buildNotification(index));
}

db.notification.insertMany(extraNotifications);
