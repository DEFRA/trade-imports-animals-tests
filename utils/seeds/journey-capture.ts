import { MongoDbClient } from '@adapters/db/mongodb-client';
import {
  CONSIGNEE_NAME,
  CONSIGNOR_NAME,
  CONTACT_ADDRESS_NAME,
  DESTINATION_NAME,
  IMPORTER_NAME,
  PLACE_OF_ORIGIN_NAME,
} from '@domain/constants/journey-options';
import type { NotificationDocument } from '@domain/models/db/notification-document';
import {
  ARRIVAL_DATE_ISO_TOKEN,
  ARRIVAL_DATE_TOKEN,
  addressBookToken,
  arrivalDateIso,
  arrivalDateValue,
  type JourneyContribution,
} from '@domain/seeds/journey-contribution-tokens';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import type { JourneyPage } from '@flows/api-journey';
import type { Journey, JourneyContext } from '@flows/journey';

/**
 * Drives a real UI journey and captures what it writes — the mapped notification
 * document and the fulfilments payload — as one contribution per page. Shared by
 * the update and check commands so they cannot disagree about how a journey is
 * driven or read back.
 *
 * Compose-only: the document half has no backend read, so it comes from Mongo.
 */
// Address-book records the journey picks by name. Their ids are minted per
// environment, so every occurrence is swapped for a token on the way out.
const PICKED_ADDRESSES = [PLACE_OF_ORIGIN_NAME, CONSIGNOR_NAME, CONSIGNEE_NAME, IMPORTER_NAME, DESTINATION_NAME, CONTACT_ADDRESS_NAME];

// One step per journey page that saves an answer, in journey order. Origin is
// answered twice by the UI — once by startNotification's defaults, then with the
// full option set — so both are folded into the one contribution.
const steps: readonly (readonly [JourneyPage, (journey: Journey) => Promise<unknown>])[] = [
  [
    'originOfImport',
    async (journey) => {
      await journey.startNotification();
      await journey.answerOrigin({ requiresRegionCode: 'Yes', internalReference: 'Imports456GB' });
    },
  ],
  ['commoditySelection', (journey) => journey.answerCommoditySelection()],
  ['consignmentDetails', (journey) => journey.answerConsignmentDetails()],
  ['animalIdentification', (journey) => journey.answerAnimalIdentification()],
  ['importReason', (journey) => journey.answerImportReason()],
  ['importPurpose', (journey) => journey.answerImportPurpose()],
  ['additionalDetails', (journey) => journey.answerAdditionalDetails()],
  ['addresses', (journey) => journey.fillAddressesToCph()],
  ['cphNumber', (journey) => journey.answerCphNumber()],
  ['arrivalDetails', (journey) => journey.answerArrivalDetails()],
  ['transitedCountries', (journey) => journey.answerTransitedCountries()],
  ['transporter', (journey) => journey.answerTransporterType()],
  ['transporterSelection', (journey) => journey.answerTransporterSelection()],
  ['contactAddress', (journey) => journey.answerContact()],
] as const;

// Address-book ids are Mongo ObjectIds. One surviving tokenisation would be
// baked into the committed fixture and resolve to nothing anywhere else.
const OBJECT_ID = /^[0-9a-f]{24}$/;

const sortKeys = (value: unknown): unknown =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)))
    : value;

const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) => sortKeys(item));

const tokenise = (value: unknown, addressNames: Map<string, string>): unknown => {
  if (value instanceof Date) {
    // Only the arrival date is expected. Any other Date would be written to the
    // fixture as a string and compared against a live Date on the next check —
    // never equal, and unclearable by re-recording. It needs its own token.
    if (value.toISOString().slice(0, 10) !== arrivalDateIso()) {
      throw new Error(`Unexpected Date ${value.toISOString()} in the notification — add a token for it in journey-contribution-tokens.ts`);
    }
    return ARRIVAL_DATE_ISO_TOKEN;
  }
  if (typeof value === 'string') {
    if (value === arrivalDateIso()) return ARRIVAL_DATE_ISO_TOKEN;
    const name = addressNames.get(value);
    return name ? addressBookToken(name) : value;
  }
  if (Array.isArray(value)) return value.map((item) => tokenise(item, addressNames));
  if (value && typeof value === 'object') {
    if (canonical(value) === canonical(arrivalDateValue())) return ARRIVAL_DATE_TOKEN;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, tokenise(item, addressNames)]));
  }
  return value;
};

/** The notification fields and fulfilment entries this step added or changed. */
const contributionOf = (before: JourneyContribution, after: JourneyContribution): JourneyContribution => ({
  notification: Object.fromEntries(
    Object.entries(after.notification).filter(([key, value]) => canonical(before.notification[key]) !== canonical(value)),
  ),
  fulfilments: after.fulfilments.filter(
    (entry) => canonical(before.fulfilments.find((seen) => seen.obligationId === entry.obligationId)) !== canonical(entry),
  ),
});

const assertFullyTokenised = (page: string, contribution: JourneyContribution): void => {
  const [leaked] = [...JSON.stringify(contribution).matchAll(/"([0-9a-f]{24})"/g)].map(([, id]) => id);
  if (leaked && OBJECT_ID.test(leaked)) {
    throw new Error(
      `Untokenised id "${leaked}" recorded on "${page}" — the journey picked an address the recorder does not know about. ` +
        'Both read their names from @domain/constants/journey-options; keep them in step.',
    );
  }
};

export type CaptureFixtures = {
  journey: Journey;
  journeyContext: JourneyContext;
  addressBookApi: AddressBookApiClient;
};

export const captureContributions = async ({
  journey,
  journeyContext,
  addressBookApi,
}: CaptureFixtures): Promise<Record<string, JourneyContribution>> => {
  const addressNames = new Map(
    await Promise.all(PICKED_ADDRESSES.map(async (name) => [(await addressBookApi.findByName(name)).id, name] as const)),
  );

  const client = new MongoDbClient();
  await client.connect();
  try {
    const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
    const contributions: Record<string, JourneyContribution> = {};
    let before: JourneyContribution = { notification: {}, fulfilments: [] };

    for (const [page, drive] of steps) {
      await drive(journey);
      const [doc] = await collection.find({ referenceNumber: journeyContext.journeyId }).toArray();
      if (!doc) {
        throw new Error(`No notification ${journeyContext.journeyId} in Mongo after "${page}" — the page's save did not persist`);
      }
      const after = tokenise(
        { notification: doc.notification ?? {}, fulfilments: doc.fulfilments ?? [] },
        addressNames,
      ) as JourneyContribution;

      contributions[page] = contributionOf(before, after);
      assertFullyTokenised(page, contributions[page]);
      before = after;
    }
    return contributions;
  } finally {
    await client.close();
  }
};
