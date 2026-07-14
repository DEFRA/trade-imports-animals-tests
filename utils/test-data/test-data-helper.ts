import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { RestClientError } from '@adapters/http/rest-client';
import { ReferenceDataClient } from '@adapters/http/reference-data-client';
import type { Notification, SpeciesEntry } from '@domain/models/api/notification';
import { buildNotificationThroughPage, type NotificationOverrides } from '@domain/builders/notification-builder';
import type { JourneyPage } from '@domain/builders/page-order';
import type { PageDataContext } from '@domain/builders/page-data-context';

/**
 * Every generated value a test may want to assert on, flattened from the
 * created notification. Fields belonging to pages the notification never
 * reached are undefined.
 */
export type NotificationIdentifiers = {
  countryCode?: string;
  internalReference?: string;
  commodityName?: string;
  species: SpeciesEntry[];
  earTags: string[];
  passports: string[];
  reasonForImport?: string;
  certifiedFor?: string;
  placeOfOriginName?: string;
  consignorName?: string;
  consigneeName?: string;
  importerName?: string;
  destinationName?: string;
  consignmentContactName?: string;
  cphNumber?: string;
  portOfEntry?: string;
  arrivalDate?: string;
  transporterName?: string;
  transporterApprovalNumber?: string;
};

export type CreatedNotification = {
  /** Server-minted, e.g. 'GBN-AG-26-1H4K2P'. */
  referenceNumber: string;
  /** The notification as the backend returned it. */
  notification: Notification;
  identifiers: NotificationIdentifiers;
};

const notificationApi = new NotificationApiClient();
const referenceData = new ReferenceDataClient();

async function pageDataContext(): Promise<PageDataContext> {
  return { countries: await referenceData.getCountries() };
}

function defined<T>(values: Array<T | undefined>): T[] {
  return values.filter((value): value is T => value !== undefined);
}

function extractIdentifiers(notification: Notification): NotificationIdentifiers {
  const species = notification.commodity?.commodityComplement?.[0]?.species ?? [];
  return {
    countryCode: notification.origin?.countryCode,
    internalReference: notification.origin?.internalReference,
    commodityName: notification.commodity?.name,
    species,
    earTags: defined(species.map((entry) => entry.earTag)),
    passports: defined(species.map((entry) => entry.passport)),
    reasonForImport: notification.reasonForImport ?? undefined,
    certifiedFor: notification.additionalDetails?.certifiedFor,
    placeOfOriginName: notification.placeOfOrigin?.name,
    consignorName: notification.consignor?.name,
    consigneeName: notification.consignee?.name,
    importerName: notification.importer?.name,
    destinationName: notification.destination?.name,
    consignmentContactName: notification.consignment?.name,
    cphNumber: notification.cphNumber ?? undefined,
    portOfEntry: notification.transport?.portOfEntry,
    arrivalDate: notification.transport?.arrivalDate,
    transporterName: notification.transport?.transporter?.name,
    transporterApprovalNumber: notification.transport?.transporter?.approvalNumber,
  };
}

const TRANSITION_RETRY_ATTEMPTS = 3;
const TRANSITION_RETRY_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submit/amend write an outbox event inside a Mongo transaction under a
 * ShedLock, so concurrent transitions can 500 transiently ("Please try
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

function toCreatedNotification(notification: Notification): CreatedNotification {
  const { referenceNumber } = notification;
  if (!referenceNumber) {
    throw new Error('Backend response did not include a referenceNumber');
  }
  return { referenceNumber, notification, identifiers: extractIdentifiers(notification) };
}

/**
 * Seeds notification state through the backend API, page-faithfully: a
 * partial draft carries exactly the fields a user would have saved by that
 * page. Values come from the frontend's canned datasets and the reference-data
 * service, with faker filling the genuinely user-typed inputs.
 */
export class TestDataHelper {
  /** Complete DRAFT: every journey page's fields populated. */
  static async createFullNotification(overrides?: NotificationOverrides): Promise<CreatedNotification> {
    return TestDataHelper.createPartialNotification({ throughPage: 'contact-address', overrides });
  }

  /** DRAFT populated cumulatively through the given page (inclusive). */
  static async createPartialNotification(options: {
    throughPage: JourneyPage;
    overrides?: NotificationOverrides;
  }): Promise<CreatedNotification> {
    const built = buildNotificationThroughPage(options.throughPage, await pageDataContext(), options.overrides);
    return toCreatedNotification(await notificationApi.createNotification(built));
  }

  static async createSubmittedNotification(overrides?: NotificationOverrides): Promise<CreatedNotification> {
    const draft = await TestDataHelper.createFullNotification(overrides);
    return toCreatedNotification(await retryTransientTransitionErrors(() => notificationApi.submitNotification(draft.referenceNumber)));
  }

  static async createAmendNotification(overrides?: NotificationOverrides): Promise<CreatedNotification> {
    const submitted = await TestDataHelper.createSubmittedNotification(overrides);
    return toCreatedNotification(await retryTransientTransitionErrors(() => notificationApi.amendNotification(submitted.referenceNumber)));
  }

  static async getNotification(referenceNumber: string): Promise<Notification> {
    return notificationApi.getNotification(referenceNumber);
  }

  static async softDeleteNotification(referenceNumber: string): Promise<void> {
    await notificationApi.softDeleteNotification(referenceNumber);
  }
}
