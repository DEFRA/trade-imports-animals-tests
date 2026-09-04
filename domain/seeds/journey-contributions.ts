// GENERATED FILE — do not edit by hand.
// Recorded from a real UI journey by utils/seeds/update-journey-contributions.ts;
// re-run it with `npm run contributions:update` when the frontend obligations or mapper change.
import type { PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';

/** What each journey page adds to a notification, in journey order. */
export const journeyContributions: Record<string, { notification: Record<string, unknown>; fulfilments: PersistedFulfilmentEntry[] }> = {
  originOfImport: {
    notification: {
      origin: {
        countryCode: 'FR',
        requiresRegionCode: 'yes',
        internalReference: 'Imports456GB',
      },
    },
    fulfilments: [
      {
        obligationId: 'a01b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
        value: 'FR',
      },
      {
        obligationId: 'b12c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e',
        value: 'yes',
      },
      {
        obligationId: 'c23d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
        value: 'FR-75',
      },
      {
        obligationId: '10e5f607-1829-4a3b-84c5-06d7e8f9a0b1',
        value: 'Imports456GB',
      },
    ],
  },
  commoditySelection: {
    notification: {
      commodity: {
        name: 'Cow',
        commodityComplement: [
          {
            typeOfCommodity: 'Domestic',
            totalNoOfAnimals: 0,
            totalNoOfPackages: 0,
            species: [
              {
                value: '1148346',
                text: 'Bos taurus',
              },
            ],
          },
        ],
      },
    },
    fulfilments: [
      {
        obligationId: '21f60718-192a-4d4e-8bcd-17e8f9a0b1c3',
        records: [
          {
            fulfilmentId: 'line0',
            value: 'Cow',
          },
        ],
      },
      {
        obligationId: '22071829-2a3b-4e5f-8cde-28f9a0b1c2d4',
        records: [
          {
            fulfilmentId: 'line0',
            value: '16',
          },
        ],
      },
      {
        obligationId: '2318293a-3b4c-4f60-8def-39a0b1c2d3e5',
        records: [
          {
            fulfilmentId: 'line0',
            value: '1148346',
          },
        ],
      },
      {
        obligationId: '24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6',
        records: [
          {
            fulfilmentId: 'line0',
            value: '',
          },
        ],
      },
      {
        obligationId: '252a3b4c-5d6e-4b82-8f01-5bc2d3e4f507',
        records: [
          {
            fulfilmentId: 'line0',
            value: '',
          },
        ],
      },
    ],
  },
  consignmentDetails: {
    notification: {
      commodity: {
        name: 'Cow',
        commodityComplement: [
          {
            typeOfCommodity: 'Domestic',
            totalNoOfAnimals: 1,
            totalNoOfPackages: 5,
            species: [
              {
                value: '1148346',
                text: 'Bos taurus',
                noOfAnimals: 1,
                noOfPackages: 5,
              },
            ],
          },
        ],
      },
    },
    fulfilments: [
      {
        obligationId: '24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6',
        records: [
          {
            fulfilmentId: 'line0',
            value: 1,
          },
        ],
      },
      {
        obligationId: '252a3b4c-5d6e-4b82-8f01-5bc2d3e4f507',
        records: [
          {
            fulfilmentId: 'line0',
            value: '5',
          },
        ],
      },
    ],
  },
  animalIdentification: {
    notification: {
      commodity: {
        name: 'Cow',
        commodityComplement: [
          {
            typeOfCommodity: 'Domestic',
            totalNoOfAnimals: 1,
            totalNoOfPackages: 5,
            species: [
              {
                value: '1148346',
                text: 'Bos taurus',
                noOfAnimals: 1,
                noOfPackages: 5,
                earTag: 'UK123456789012',
                passport: '',
              },
            ],
          },
        ],
      },
    },
    fulfilments: [
      {
        obligationId: '39657a80-91a2-4fc6-8345-9f0617284a51',
        records: [
          {
            fulfilmentId: 'line0.unit0',
            value: '',
          },
        ],
      },
      {
        obligationId: '3a768b91-a2b3-4fd7-8456-a01728395b62',
        records: [
          {
            fulfilmentId: 'line0.unit0',
            value: '',
          },
        ],
      },
      {
        obligationId: '3b879ca2-b3c4-4fe8-8567-a1283a4a6c73',
        records: [
          {
            fulfilmentId: 'line0.unit0',
            value: 'UK123456789012',
          },
        ],
      },
    ],
  },
  importReason: {
    notification: {
      reasonForImport: 'internalMarket',
    },
    fulfilments: [
      {
        obligationId: 'd34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f',
        value: 'internalMarket',
      },
    ],
  },
  importPurpose: {
    notification: {},
    fulfilments: [
      {
        obligationId: 'e45f6a7b-8c9d-4e01-8f23-4a5b6c7d8e9f',
        value: 'breeding',
      },
    ],
  },
  additionalDetails: {
    notification: {
      additionalDetails: {
        certifiedFor: 'slaughter',
        unweanedAnimals: 'no',
      },
    },
    fulfilments: [
      {
        obligationId: '01a2b3c4-d5e6-4f07-8a89-0b1c2d3e4f5a',
        value: 'no',
      },
      {
        obligationId: '274c5d6e-7f80-4da4-8123-7de4f5061729',
        value: 'slaughter',
      },
    ],
  },
  addresses: {
    notification: {
      placeOfOrigin: {
        name: 'Origin Farm',
        email: 'contact@example.com',
        phone: '+44 1234 567890',
        address: {
          addressLine1: '1 Farm Lane',
          townOrCity: 'Ennis',
          postcode: 'V95 X7P2',
          countryCode: 'IE',
        },
      },
      consignor: {
        addressId: '{{addressBook:Astra Rosales}}',
      },
      consignee: {
        addressId: '{{addressBook:British Livestock Ltd}}',
      },
      importer: {
        addressId: '{{addressBook:Import Co UK}}',
      },
      destination: {
        addressId: '{{addressBook:Tech Imports Ltd}}',
      },
    },
    fulfilments: [
      {
        obligationId: '89c0d1e2-f3a4-4b5f-8c0b-8d9e0f1a2b3c',
        value: {
          addressId: '{{addressBook:Origin Farm}}',
          name: 'Origin Farm',
          address: {
            addressLine1: '1 Farm Lane',
            addressLine2: null,
            townOrCity: 'Ennis',
            county: null,
            postalOrZipCode: 'V95 X7P2',
            country: 'Ireland',
            telephoneNumber: '+44 1234 567890',
            emailAddress: 'contact@example.com',
          },
        },
      },
      {
        obligationId: '9ad1e2f3-a4b5-4c60-8d1c-9e0f1a2b3c4d',
        value: {
          addressId: '{{addressBook:Astra Rosales}}',
        },
      },
      {
        obligationId: 'abe2f3a4-b5c6-4d71-8e2d-af0a1b2c3d4e',
        value: {
          addressId: '{{addressBook:British Livestock Ltd}}',
        },
      },
      {
        obligationId: 'bcf3a4b5-c6d7-4e82-8f3e-ba1b2c3d4e5f',
        value: {
          addressId: '{{addressBook:Import Co UK}}',
        },
      },
      {
        obligationId: 'cd04b5c6-d7e8-4f93-8a4f-cb2c3d4e5f60',
        value: {
          addressId: '{{addressBook:Tech Imports Ltd}}',
        },
      },
    ],
  },
  cphNumber: {
    notification: {
      cphNumber: '123456789',
    },
    fulfilments: [
      {
        obligationId: '263b4c5d-6e7f-4c93-8012-6cd3e4f50618',
        value: '123456789',
      },
    ],
  },
  arrivalDetails: {
    notification: {
      transport: {
        portOfEntry: 'GB ABD',
        arrivalDate: '{{arrivalDateIso}}',
      },
    },
    fulfilments: [
      {
        obligationId: '45e6f7a8-b9c0-4d1b-8ecd-4f5a6b7c8d9e',
        value: 'ROAD_VEHICLE',
      },
      {
        obligationId: '56f7a8b9-c0d1-4e2c-8fde-5a6b7c8d9e0f',
        value: 'FR-892-LK',
      },
      {
        obligationId: '67a8b9c0-d1e2-4f3d-8aef-6b7c8d9e0f1a',
        value: 'CMR-2026-884721',
      },
      {
        obligationId: '12b3c4d5-e6f7-4a08-8b9a-1c2d3e4f5a6b',
        value: '{{arrivalDate}}',
      },
      {
        obligationId: '23c4d5e6-f7a8-4b09-8cab-2d3e4f5a6b7c',
        value: 'GB ABD',
      },
    ],
  },
  transitedCountries: {
    notification: {},
    fulfilments: [
      {
        obligationId: '78b9c0d1-e2f3-4a4e-8bfa-7c8d9e0f1a2b',
        value: ['BE', 'FR'],
      },
    ],
  },
  transporter: {
    notification: {
      transport: {
        portOfEntry: 'GB ABD',
        arrivalDate: '{{arrivalDateIso}}',
        transporter: {
          type: 'Commercial',
        },
      },
    },
    fulfilments: [
      {
        obligationId: '34d5e6f7-a8b9-4c0a-8dbc-3e4f5a6b7c8d',
        value: 'Commercial',
      },
    ],
  },
  transporterSelection: {
    notification: {
      transport: {
        portOfEntry: 'GB ABD',
        arrivalDate: '{{arrivalDateIso}}',
        transporter: {
          name: 'García Livestock Transport SL',
          address: {
            addressLine1: '43 East Hague Extension',
            addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
          },
          approvalNumber: 'ES-T2-45001294',
          type: 'Commercial',
        },
      },
    },
    fulfilments: [
      {
        obligationId: 'de15c6d7-e8f9-4a04-8b50-dc3d4e5f6071',
        value: {
          name: 'García Livestock Transport SL',
          address: {
            addressLine1: '43 East Hague Extension',
            addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
            addressLine3: 'Quasoccaecat ut ear, 30055',
            country: 'Switzerland',
          },
          approvalNumber: 'ES-T2-45001294',
        },
      },
    ],
  },
  contactAddress: {
    notification: {
      consignment: {
        name: 'Animal and Plant Health Agency',
        email: 'contact@example.com',
        phone: '+44 1234 567890',
        address: {
          addressLine1: 'Woodham Lane',
          townOrCity: 'Addlestone',
          postcode: 'KT15 3NB',
          countryCode: 'GB',
        },
      },
    },
    fulfilments: [
      {
        obligationId: 'f037e8f9-a0b1-4c26-8d72-fe5f60718293',
        value: {
          addressId: '{{addressBook:Animal and Plant Health Agency}}',
          name: 'Animal and Plant Health Agency',
          address: {
            addressLine1: 'Woodham Lane',
            addressLine2: null,
            townOrCity: 'Addlestone',
            county: null,
            postalOrZipCode: 'KT15 3NB',
            country: 'United Kingdom',
            telephoneNumber: '+44 1234 567890',
            emailAddress: 'contact@example.com',
          },
        },
      },
    ],
  },
};
