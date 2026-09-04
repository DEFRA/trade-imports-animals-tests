import type { Notification } from '@domain/models/api/notification';
import type { PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';
import { getRelativeAppDateIso, getRelativeAppDateParts } from '@utils/date-utils';

/**
 * The notification a completed UI journey leaves behind, as the two payloads
 * the frontend writes.
 *
 * A save sends both: the opaque `fulfilments` the UI reads its own answers back
 * from, and the notification document the backend reads — the dashboard list,
 * the GBN-AG outbox events and the amendment baseline all come off the
 * document, none of them off the fulfilments. Seeding only one of the two mints
 * a notification no journey could have produced: right on the notification
 * view, blank on the dashboard, and empty in every event it emits.
 *
 * Both payloads below were captured verbatim from a real run of
 * `Journey.submitNotification()` — read back out of Mongo, not hand-derived —
 * so the seed stays in step with the frontend's mapper rather than with
 * somebody's reading of it. Recapture them (rather than patching by hand) when
 * the journey's answers change.
 *
 * Two things are resolved per run instead of being baked in: the address-book
 * ids, which Mongo mints when `globalSetup` seeds the fixtures, and the arrival
 * date, which has to stay inside the app's arrival window. Everything else is
 * fixed, because the address-book records the journey picks are this repo's own
 * fixtures.
 *
 * @see repos/trade-imports-animals-frontend/src/server/app/services/persistence/records/real/lifecycle/mutate.js
 */

/** Address-book fixtures the journey picks, by the role each one fills. */
export const SEEDED_PARTY_NAMES = {
  consignor: 'Astra Rosales',
  consignee: 'British Livestock Ltd',
  importer: 'Import Co UK',
  destination: 'Tech Imports Ltd',
  placeOfOrigin: 'Origin Farm',
  contact: 'Animal and Plant Health Agency',
} as const;

export type SeededPartyRole = keyof typeof SEEDED_PARTY_NAMES;

/** The address-book id standing behind each role, resolved by name at seed time. */
export type SeededPartyIds = Record<SeededPartyRole, string>;

// Obligation UUIDs mirror the frontend obligation model — keep in step with
// repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/
const COUNTRY_OF_ORIGIN = 'a01b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const REGION_OF_ORIGIN_CODE_REQUIREMENT = 'b12c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';
const REGION_OF_ORIGIN_CODE = 'c23d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f';
const REASON_FOR_IMPORT = 'd34e5f6a-7b8c-4d9e-8f01-2a3b4c5d6e7f';
const PURPOSE_IN_INTERNAL_MARKET = 'e45f6a7b-8c9d-4e01-8f23-4a5b6c7d8e9f';
const CONTAINS_UNWEANED_ANIMALS = '01a2b3c4-d5e6-4f07-8a89-0b1c2d3e4f5a';
const PLACE_OF_ORIGIN = '89c0d1e2-f3a4-4b5f-8c0b-8d9e0f1a2b3c';
const CONSIGNOR = '9ad1e2f3-a4b5-4c60-8d1c-9e0f1a2b3c4d';
const CONSIGNEE = 'abe2f3a4-b5c6-4d71-8e2d-af0a1b2c3d4e';
const IMPORTER = 'bcf3a4b5-c6d7-4e82-8f3e-ba1b2c3d4e5f';
const PLACE_OF_DESTINATION = 'cd04b5c6-d7e8-4f93-8a4f-cb2c3d4e5f60';
const TRANSPORTER_TYPE = '34d5e6f7-a8b9-4c0a-8dbc-3e4f5a6b7c8d';
const COMMERCIAL_TRANSPORTER = 'de15c6d7-e8f9-4a04-8b50-dc3d4e5f6071';
const MEANS_OF_TRANSPORT = '45e6f7a8-b9c0-4d1b-8ecd-4f5a6b7c8d9e';
const TRANSPORT_IDENTIFICATION = '56f7a8b9-c0d1-4e2c-8fde-5a6b7c8d9e0f';
const TRANSPORT_DOCUMENT_REFERENCE = '67a8b9c0-d1e2-4f3d-8aef-6b7c8d9e0f1a';
const TRANSITED_COUNTRIES = '78b9c0d1-e2f3-4a4e-8bfa-7c8d9e0f1a2b';
const ARRIVAL_DATE_AT_PORT = '12b3c4d5-e6f7-4a08-8b9a-1c2d3e4f5a6b';
const PORT_OF_ENTRY = '23c4d5e6-f7a8-4b09-8cab-2d3e4f5a6b7c';
const CONTACT_ADDRESS = 'f037e8f9-a0b1-4c26-8d72-fe5f60718293';
const INTERNAL_REFERENCE_NUMBER = '10e5f607-1829-4a3b-84c5-06d7e8f9a0b1';
const ANIMALS_CERTIFIED_FOR = '274c5d6e-7f80-4da4-8123-7de4f5061729';
const COMMODITY_SELECTION = '21f60718-192a-4d4e-8bcd-17e8f9a0b1c3';
const COMMODITY_TYPE = '22071829-2a3b-4e5f-8cde-28f9a0b1c2d4';
const SPECIES_SELECTION = '2318293a-3b4c-4f60-8def-39a0b1c2d3e5';
const NUMBER_OF_ANIMALS = '24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6';
const NUMBER_OF_PACKAGES = '252a3b4c-5d6e-4b82-8f01-5bc2d3e4f507';
const COUNTY_PARISH_HOLDING_CPH = '263b4c5d-6e7f-4c93-8012-6cd3e4f50618';
const ANIMAL_IDENTIFIER_PASSPORT = '39657a80-91a2-4fc6-8345-9f0617284a51';
const ANIMAL_IDENTIFIER_TATTOO = '3a768b91-a2b3-4fd7-8456-a01728395b62';
const ANIMAL_IDENTIFIER_EAR_TAG = '3b879ca2-b3c4-4fe8-8567-a1283a4a6c73';

/** The one commodity line the journey fills in. */
const LINE = 'line0';
/** Its one animal-identifier unit. */
const UNIT = 'line0.unit0';

/** The journey answers the arrival date one month out, as `Journey` does. */
const ARRIVAL_MONTHS_AHEAD = 1;

const scalar = (obligationId: string, value: unknown): PersistedFulfilmentEntry => ({ obligationId, value });

const record = (obligationId: string, fulfilmentId: string, value: unknown): PersistedFulfilmentEntry => ({
  obligationId,
  records: [{ fulfilmentId, value }],
});

/**
 * A party the journey holds as a link — the id alone, so an address edited in
 * the address book shows through without the notification being touched.
 */
const reference = (addressId: string): { addressId: string } => ({ addressId });

/**
 * The `fulfilments` payload — the frontend's opaque answers blob, in the order
 * the journey fills the pages in.
 */
export function seededFulfilments(parties: SeededPartyIds): PersistedFulfilmentEntry[] {
  return [
    scalar(COUNTRY_OF_ORIGIN, 'FR'),
    scalar(REGION_OF_ORIGIN_CODE_REQUIREMENT, 'yes'),
    scalar(REGION_OF_ORIGIN_CODE, 'FR-75'),
    scalar(REASON_FOR_IMPORT, 'internalMarket'),
    scalar(PURPOSE_IN_INTERNAL_MARKET, 'breeding'),
    scalar(CONTAINS_UNWEANED_ANIMALS, 'no'),
    // Place of origin and the contact address are copies, not links, so the
    // journey stores the whole address block beside the id it was taken from.
    scalar(PLACE_OF_ORIGIN, {
      addressId: parties.placeOfOrigin,
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
    }),
    scalar(CONSIGNOR, reference(parties.consignor)),
    scalar(CONSIGNEE, reference(parties.consignee)),
    scalar(IMPORTER, reference(parties.importer)),
    scalar(PLACE_OF_DESTINATION, reference(parties.destination)),
    scalar(TRANSPORTER_TYPE, 'Commercial'),
    scalar(COMMERCIAL_TRANSPORTER, {
      name: 'García Livestock Transport SL',
      address: {
        addressLine1: '43 East Hague Extension',
        addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
        addressLine3: 'Quasoccaecat ut ear, 30055',
        country: 'Switzerland',
      },
      approvalNumber: 'ES-T2-45001294',
    }),
    scalar(MEANS_OF_TRANSPORT, 'ROAD_VEHICLE'),
    scalar(TRANSPORT_IDENTIFICATION, 'FR-892-LK'),
    scalar(TRANSPORT_DOCUMENT_REFERENCE, 'CMR-2026-884721'),
    scalar(TRANSITED_COUNTRIES, ['BE', 'FR']),
    scalar(ARRIVAL_DATE_AT_PORT, getRelativeAppDateParts({ monthOffset: ARRIVAL_MONTHS_AHEAD })),
    scalar(PORT_OF_ENTRY, 'GB ABD'),
    scalar(CONTACT_ADDRESS, {
      addressId: parties.contact,
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
    }),
    scalar(INTERNAL_REFERENCE_NUMBER, 'Imports456GB'),
    scalar(ANIMALS_CERTIFIED_FOR, 'slaughter'),
    record(COMMODITY_SELECTION, LINE, 'Cow'),
    record(COMMODITY_TYPE, LINE, '16'),
    record(SPECIES_SELECTION, LINE, '1148346'),
    record(NUMBER_OF_ANIMALS, LINE, 1),
    record(NUMBER_OF_PACKAGES, LINE, '5'),
    scalar(COUNTY_PARISH_HOLDING_CPH, '123456789'),
    record(ANIMAL_IDENTIFIER_PASSPORT, UNIT, ''),
    record(ANIMAL_IDENTIFIER_TATTOO, UNIT, ''),
    record(ANIMAL_IDENTIFIER_EAR_TAG, UNIT, 'UK123456789012'),
  ];
}

/**
 * The notification document — the frontend's Mapper A projection of exactly the
 * answers above. Fields the mapper has no home for (the region code, the
 * transit list, the tattoo) are absent here by design, not by omission.
 */
export function seededNotification(parties: SeededPartyIds): Notification {
  return {
    origin: {
      countryCode: 'FR',
      requiresRegionCode: 'yes',
      internalReference: 'Imports456GB',
    },
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
              noOfPackages: '5',
              earTag: 'UK123456789012',
              passport: '',
            },
          ],
        },
      ],
    },
    reasonForImport: 'internalMarket',
    additionalDetails: {
      certifiedFor: 'slaughter',
      unweanedAnimals: 'no',
    },
    // The two inline roles carry their details across; the mapper translates
    // the journey's field names into the address book's on the way.
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
    consignor: reference(parties.consignor),
    consignee: reference(parties.consignee),
    importer: reference(parties.importer),
    destination: reference(parties.destination),
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
    cphNumber: '123456789',
    transport: {
      portOfEntry: 'GB ABD',
      arrivalDate: getRelativeAppDateIso({ monthOffset: ARRIVAL_MONTHS_AHEAD }),
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
  };
}
