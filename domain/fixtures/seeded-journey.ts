import type { FormFields } from '@adapters/http/frontend-form-client';
import { getRelativeAppDateText } from '@utils/date-utils';

/**
 * One complete journey, as pages and the values a trader types into them.
 *
 * This is the whole of what the tests repo knows about seeding: page slugs,
 * form field names and valid answers — the same knowledge the page objects
 * already carry. It holds no obligation ids, no fulfilment shapes and no
 * notification-document shape, because the frontend derives all three from
 * these answers when it saves the page.
 *
 * Keep the answers in step with `flows/journey.ts`, which drives the same pages
 * through the browser. `api-seed-parity.spec.ts` compares the two.
 */

/** Address-book records the shared journey fixtures create in globalSetup. */
export const PARTY_NAMES = {
  placeOfOrigin: 'Origin Farm',
  consignor: 'Astra Rosales',
  consignee: 'British Livestock Ltd',
  importer: 'Import Co UK',
  placeOfDestination: 'Tech Imports Ltd',
  contact: 'Animal and Plant Health Agency',
} as const;

export type PartyRole = keyof typeof PARTY_NAMES;

/** The address book id resolved for each party, by role. */
export type PartyIds = Record<PartyRole, string>;

export type SeedStep = {
  /** Path under /notifications/{journeyId}/ — the page's own slug. */
  slug: string;
  form: FormFields;
};

/**
 * Where to stop. Most specs want a notification that exists and shows a filled
 * dashboard card; only the ones that submit need every page.
 *
 * The lever on seeding cost is pages per seed, not posts per page: a page
 * accepts only its own fields, so there is no shorter way to answer one.
 */
export type SeedDepth = 'draft' | 'readyToSubmit';

// The commodity picker's checkbox value: one commodity paired with one species,
// which together identify a line. 'Bos taurus' as the trader sees it.
const CATTLE_LINE = 'Cow|1148346';

// The first (and only) commodity line. Quantity and identifier fields are
// suffixed with their line index, so a second line would be -1.
const LINE = 0;

const originStep: SeedStep = {
  slug: 'origin',
  form: {
    countryOfOrigin: 'FR',
    regionOfOriginCodeRequirement: 'yes',
    // The country prefix is filled in for the trader, so the box asks only for
    // what follows it; the stored code is the two joined.
    regionOfOriginCodeSuffix: '75',
    internalReferenceNumber: 'Imports456GB',
  },
};

const commoditySteps: SeedStep[] = [
  { slug: 'commodities', form: { species: CATTLE_LINE } },
  {
    slug: 'consignment-details',
    form: { [`numberOfAnimalsQuantity-${LINE}`]: '1', [`numberOfPackages-${LINE}`]: '5' },
  },
  { slug: 'commodities/identification', form: { [`animalIdentifierEarTag-${LINE}`]: 'UK123456789012' } },
];

const consignmentSteps: SeedStep[] = [
  { slug: 'import-reason', form: { reasonForImport: 'internalMarket', purposeInInternalMarket: 'breeding' } },
  { slug: 'additional-details', form: { animalsCertifiedFor: 'slaughter', containsUnweanedAnimals: 'no' } },
];

/**
 * Each picker takes an address book id and nothing else. The frontend resolves
 * the record and shapes it — which is why no address fields appear here, and
 * why the inline parties need no field renaming on the way in.
 */
const addressSteps = (parties: PartyIds): SeedStep[] => [
  { slug: 'consignors/select', form: { party: parties.consignor } },
  { slug: 'destinations/select', form: { party: parties.placeOfDestination } },
  { slug: 'place-of-origin/select', form: { party: parties.placeOfOrigin } },
  { slug: 'consignees/select', form: { party: parties.consignee } },
  { slug: 'importers/select', form: { party: parties.importer } },
  // The pickers each hand the trader back to the hub, so the hub's own
  // Continue is what carries them on to the CPH number.
  { slug: 'addresses', form: {} },
  { slug: 'cph-number', form: { countyParishHoldingCph: '12/345/6789' } },
];

const arrivalStep: SeedStep = {
  slug: 'port-of-entry',
  form: {
    // The picker's own d/m/yyyy text, inside the arrival window wherever the
    // wall clock is. The frontend derives every other representation.
    arrivalDateAtPort: getRelativeAppDateText({ monthOffset: 1 }),
    portOfEntry: 'GB ABD',
    meansOfTransport: 'ROAD_VEHICLE',
    transportIdentification: 'FR-892-LK',
    transportDocumentReference: 'CMR-2026-884721',
  },
};

// Transited countries stay in scope because the consignment arrives by road.
// A checkbox group posts in the order the page lists its boxes, not the order
// the trader ticked them, so Belgium leads France however the journey reads.
const transportSteps: SeedStep[] = [
  { slug: 'transit-countries', form: { transitedCountries: ['BE', 'FR'] } },
  { slug: 'transporters', form: { transporterType: 'Commercial' } },
  { slug: 'transporters/select', form: { commercialTransporter: 'garcia-livestock-transport' } },
];

const contactStep = (parties: PartyIds): SeedStep => ({
  slug: 'consignment/contact/select',
  form: { contactAddress: parties.contact },
});

export const seedSteps = (parties: PartyIds, depth: SeedDepth): SeedStep[] => {
  const throughArrival = [originStep, ...commoditySteps, ...consignmentSteps, ...addressSteps(parties), arrivalStep];
  return depth === 'draft' ? throughArrival : [...throughArrival, ...transportSteps, contactStep(parties)];
};

/** The declaration is a transition, not an answer section, so it stands apart. */
export const declarationStep: SeedStep = { slug: 'declaration', form: { declaration: 'confirmed' } };
