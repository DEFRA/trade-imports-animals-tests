import type { Locator } from '@playwright/test';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { RestClientError } from '@adapters/http/rest-client';
import type { Notification, Operator, SpeciesEntry, Transporter } from '@domain/models/api/notification';
import type { PageObjects } from '@page-objects';
import type { JourneyContext } from '@flows/journey';
import type { DateInput } from '@domain/types/date-time-input';
import { commoditySpecies, type CommoditySpecies } from '@domain/constants/commodity-species';
import type { YesNoValue } from '@domain/constants/yes-no-values';
import {
  CONSIGNEE_NAME,
  CONSIGNOR_NAME,
  CONTACT_ADDRESS_NAME,
  CPH_NUMBER,
  DESTINATION_NAME,
  EAR_TAG_PREFIX,
  IMPORTER_NAME,
  PASSPORT_PREFIX,
  PLACE_OF_ORIGIN_NAME,
  TRANSPORTER_NAME,
  defaultJourneyOptions,
  type JourneyOptions,
} from '@domain/constants/journey-options';

/**
 * The exact records the UI journey selects by name
 * (`domain/constants/journey-options.ts`'s CONSIGNOR_NAME etc.), copied from
 * the frontend's canned address lists. Kept here as the one place API-seeded
 * notifications need full address data — `journey-options.ts` only needs the
 * name, since the UI looks the rest up itself.
 */
const CANNED_OPERATORS: Record<'placeOfOrigin' | 'consignor' | 'consignee' | 'importer' | 'destination' | 'contact', Operator> = {
  placeOfOrigin: {
    name: PLACE_OF_ORIGIN_NAME,
    address: { addressLine1: '1 Farm Lane', addressLine2: 'County Clare', country: 'Ireland' },
  },
  consignor: {
    name: CONSIGNOR_NAME,
    address: {
      addressLine1: '43 East Hague Extension',
      addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
      addressLine3: 'Quasoccaecat ut ear, 30055',
      country: 'Switzerland',
    },
  },
  consignee: {
    name: CONSIGNEE_NAME,
    address: { addressLine1: '10 Market Street', addressLine2: 'Leeds LS1 6HB', country: 'United Kingdom' },
  },
  importer: {
    name: IMPORTER_NAME,
    address: { addressLine1: '20 Trade Road', addressLine2: 'London EC1A 1BB', country: 'United Kingdom' },
  },
  destination: {
    name: DESTINATION_NAME,
    address: { addressLine1: '643 Main Street', addressLine2: 'Birmingham G1 3AZ', country: 'United Kingdom' },
  },
  contact: {
    name: CONTACT_ADDRESS_NAME,
    address: {
      addressLine1: 'Woodham Lane',
      addressLine2: 'New Haw',
      addressLine3: 'Addlestone, KT15 3NB',
      country: 'United Kingdom',
    },
  },
};

const CANNED_TRANSPORTER: Transporter = {
  name: TRANSPORTER_NAME,
  address: {
    addressLine1: '43 East Hague Extension',
    addressLine2: 'Delectus sitodio p. Laborum Odio tempor',
    addressLine3: 'Quasoccaecat ut ear, 30055',
    country: 'Switzerland',
  },
  approvalNumber: 'ES-T2-45001294',
  type: 'Commercial',
};

/** The frontend's mock-species.json `value` id for each `commoditySpecies` text. */
const SPECIES_VALUE_IDS: Record<CommoditySpecies, string> = {
  [commoditySpecies.bisonBison]: '716661',
  [commoditySpecies.bosSpp]: '1388624',
  [commoditySpecies.bosTaurus]: '1148346',
  [commoditySpecies.bubalusBubalis]: '749313',
};

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/** The frontend lowercases Yes/No before saving. */
function toWireYesNo(value: YesNoValue | undefined): string | undefined {
  return value === undefined ? undefined : value.toLowerCase();
}

function toIsoDate(date: DateInput): string {
  return `${date.year}-${date.month.padStart(2, '0')}-${date.day.padStart(2, '0')}`;
}

export const journeyPages = [
  'originOfImport',
  'commoditySelection',
  'speciesSelection',
  'importReason',
  'commodityDetails',
  'animalIdentification',
  'additionalDetails',
  'accompanyingDocuments',
  'placeOfOriginSelection',
  'consignorSelection',
  'consigneeSelection',
  'importerSelection',
  'destinationSelection',
  'cphNumber',
  'entryPoint',
  'transporter',
  'contactAddress',
] as const satisfies readonly (keyof PageObjects)[];

export type JourneyPage = (typeof journeyPages)[number];

type Options = Required<JourneyOptions>;
type PageContribution = (draft: Notification, options: Options) => void;

/**
 * One function per UI page, applied cumulatively in journey order so a draft
 * built through page N carries exactly the fields a user would have saved by
 * page N. Defaults come from `domain/constants/journey-options.ts`'s
 * `defaultJourneyOptions` and named constants — the same module `Journey`
 * itself draws from — so there is one source of truth for what a "default"
 * test notification looks like.
 */
const pageContributions: Record<JourneyPage, PageContribution> = {
  originOfImport(draft, options) {
    draft.origin = {
      countryCode: options.countryCode,
      requiresRegionCode: toWireYesNo(options.requiresRegionCode),
      internalReference: options.internalReference,
    };
  },

  commoditySelection(draft, options) {
    draft.commodity = { name: options.commodityCode };
  },

  speciesSelection(draft, options) {
    const species: SpeciesEntry[] = toArray(options.species).map((entry) => ({
      value: SPECIES_VALUE_IDS[entry],
      text: entry,
    }));
    draft.commodity = {
      name: draft.commodity?.name ?? options.commodityCode,
      commodityComplement: [{ typeOfCommodity: options.commodityType, species }],
    };
  },

  importReason(draft, options) {
    draft.reasonForImport = options.importReason;
  },

  commodityDetails(draft, options) {
    const complement = draft.commodity?.commodityComplement?.[0];
    if (!complement) {
      throw new Error('commodityDetails requires speciesSelection to have run first');
    }
    const animals = toArray(options.noOfAnimals);
    const packages = toArray(options.noOfPackages);
    const speciesCount = complement.species.length;
    if (animals.length !== speciesCount || packages.length !== speciesCount) {
      throw new Error(`Mismatched quantities: species=${speciesCount}, noOfAnimals=${animals.length}, noOfPackages=${packages.length}`);
    }
    complement.species = complement.species.map((entry, index) => ({
      ...entry,
      noOfAnimals: animals[index],
      noOfPackages: packages[index],
    }));
    complement.totalNoOfAnimals = animals.reduce((total, count) => total + count, 0);
    complement.totalNoOfPackages = packages.reduce((total, count) => total + count, 0);
  },

  animalIdentification(draft) {
    const complement = draft.commodity?.commodityComplement?.[0];
    if (!complement) {
      throw new Error('animalIdentification requires speciesSelection to have run first');
    }
    complement.species = complement.species.map((entry, index) => {
      const digits = String(index + 1).padStart(12, '0');
      return { ...entry, earTag: `${EAR_TAG_PREFIX}${digits}`, passport: `${PASSPORT_PREFIX}${digits.slice(-6)}` };
    });
  },

  additionalDetails(draft, options) {
    draft.additionalDetails = {
      certifiedFor: options.certificationPurpose,
      unweanedAnimals: toWireYesNo(options.unweanedAnimals),
    };
  },

  // Accompanying documents go to the separate document service and
  // contribute nothing to the notification payload itself.
  accompanyingDocuments() {},

  placeOfOriginSelection(draft) {
    draft.placeOfOrigin = CANNED_OPERATORS.placeOfOrigin;
  },

  consignorSelection(draft) {
    draft.consignor = CANNED_OPERATORS.consignor;
  },

  consigneeSelection(draft) {
    draft.consignee = CANNED_OPERATORS.consignee;
  },

  importerSelection(draft) {
    draft.importer = CANNED_OPERATORS.importer;
  },

  destinationSelection(draft) {
    draft.destination = CANNED_OPERATORS.destination;
  },

  cphNumber(draft) {
    draft.cphNumber = CPH_NUMBER;
  },

  entryPoint(draft, options) {
    draft.transport = {
      ...draft.transport,
      portOfEntry: options.pointOfEntry.code,
      arrivalDate: toIsoDate(options.arrivalDate),
      meansOfTransport: options.meansOfTransport.code,
      transportIdentification: options.transportIdentification,
      transportDocumentReference: options.transportDocumentReference,
    };
  },

  transporter(draft) {
    draft.transport = { ...draft.transport, transporter: CANNED_TRANSPORTER };
  },

  contactAddress(draft) {
    draft.consignment = CANNED_OPERATORS.contact;
  },
};

export type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
export type NotificationOverrides = DeepPartial<Notification>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Objects merge recursively; arrays and primitives replace wholesale. */
function deepMerge<T>(target: T, overrides: DeepPartial<T>): T {
  const result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    const current = result[key];
    result[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return result as T;
}

function buildNotificationUpToPage(upToPage: JourneyPage, options: JourneyOptions, overrides?: NotificationOverrides): Notification {
  const merged: Options = { ...defaultJourneyOptions, ...options };
  const draft: Notification = {};
  for (const page of journeyPages) {
    pageContributions[page](draft, merged);
    if (page === upToPage) break;
  }
  return overrides ? deepMerge(draft, overrides) : draft;
}

const TRANSITION_RETRY_ATTEMPTS = 3;
const TRANSITION_RETRY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submit/amend write an outbox event inside a Mongo transaction under a
 * ShedLock, so concurrent transitions can 500 transiently ("please try
 * again"); retry the way a UI user would.
 */
async function retryTransientTransitionErrors<T>(action: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt < TRANSITION_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      if (!(error instanceof RestClientError) || error.status !== 500) {
        throw error;
      }
      await delay(TRANSITION_RETRY_DELAY_MS * attempt);
    }
  }
  return action();
}

/**
 * Seeds notification state through the backend API instead of driving the UI
 * wizard page by page. A partial draft carries exactly the fields a user
 * would have saved by the given page, using the same defaults as `Journey`
 * (both draw from `domain/constants/journey-options.ts`).
 */
export class ApiJourney {
  constructor(
    private readonly pages: PageObjects,
    private readonly api: NotificationApiClient,
    private readonly journeyContext: JourneyContext,
  ) {}

  async createUpToPage(upToPage: JourneyPage, options: JourneyOptions = {}, overrides?: NotificationOverrides): Promise<Notification> {
    const notification = await this.api.saveNotification(buildNotificationUpToPage(upToPage, options, overrides));
    this.journeyContext.notificationId = notification.referenceNumber;
    return notification;
  }

  /** Complete DRAFT: every journey page's fields populated. */
  async createFullNotification(options: JourneyOptions = {}, overrides?: NotificationOverrides): Promise<Notification> {
    return this.createUpToPage('contactAddress', options, overrides);
  }

  async createSubmittedNotification(options: JourneyOptions = {}, overrides?: NotificationOverrides): Promise<Notification> {
    const draft = await this.createFullNotification(options, overrides);
    return retryTransientTransitionErrors(() => this.api.submitNotification(draft.referenceNumber));
  }

  async createAmendNotification(options: JourneyOptions = {}, overrides?: NotificationOverrides): Promise<Notification> {
    const submitted = await this.createSubmittedNotification(options, overrides);
    return retryTransientTransitionErrors(() => this.api.amendNotification(submitted.referenceNumber));
  }

  /**
   * Opens an API-seeded notification in the frontend and lands on any wizard
   * page — not just the one after where seeding stopped. Viewing the
   * notification hydrates the browser session from the full backend
   * document (see the frontend's notification-client.js `get()`), so every
   * wizard page's session-derived fields are populated regardless of how far
   * the seed got.
   */
  async resumeInUi<T extends { expectedUrl: string; heading: Locator }>(referenceNumber: string, targetPage: T): Promise<T> {
    await this.pages.notificationView.open(referenceNumber);
    await this.pages.notificationView.navigateToFrontend(targetPage.expectedUrl);
    await targetPage.heading.waitFor();
    return targetPage;
  }
}
