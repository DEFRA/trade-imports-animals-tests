import type { Locator } from '@playwright/test';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { journeyContributions } from '@domain/seeds/journey-contributions';
import { defaultActor } from '@domain/models/api/actor';
import type { NotificationFulfilments } from '@domain/models/api/notification-fulfilments';
import type { PageObjects } from '@page-objects';
import type { JourneyContext } from '@flows/journey';
import { addressBookNamesIn, resolveTokens } from '@domain/seeds/journey-contribution-tokens';

export const journeyPages = [
  'originOfImport',
  'commoditySelection',
  'consignmentDetails',
  'animalIdentification',
  'importReason',
  'importPurpose',
  'additionalDetails',
  'accompanyingDocuments',
  'addresses',
  'cphNumber',
  'arrivalDetails',
  'transitedCountries',
  'transporter',
  'transporterSelection',
  'contactAddress',
] as const satisfies readonly (keyof PageObjects)[];

export type JourneyPage = (typeof journeyPages)[number];

// Documents live in the document service, so that page alone contributes nothing.
// Any other page missing from the recording means this list and the recorder's
// steps have drifted — which the check cannot see between.
const PAGES_WITHOUT_CONTRIBUTIONS: readonly JourneyPage[] = ['accompanyingDocuments'];

/**
 * Seeds notifications through the backend API rather than driving the wizard,
 * from contributions recorded off a real UI journey — so one seeded through page
 * N carries what a user would have saved by page N.
 *
 * The recording is only verified on compose, where `contributions:check` can read
 * the mapped document from Mongo. CI checks it against the images CDP then
 * deploys; a frontend deployed ahead of that would drift here unnoticed.
 */
export class ApiJourney {
  private addressIds?: Promise<Map<string, string>>;

  constructor(
    private readonly pages: PageObjects,
    private readonly api: NotificationApiClient,
    private readonly addressBook: AddressBookApiClient,
    private readonly context: JourneyContext,
  ) {}

  private remember(aggregate: NotificationFulfilments): NotificationFulfilments {
    this.context.journeyId = aggregate.referenceNumber;
    this.context.referenceNumber = aggregate.referenceNumber;
    return aggregate;
  }

  private resolvedAddressIds(): Promise<Map<string, string>> {
    // Resolved from every contribution rather than the page being seeded, so the
    // one lookup a test makes covers whatever any later page asks for.
    const names = addressBookNamesIn(Object.values(journeyContributions));
    this.addressIds ??= Promise.all(names.map(async (name) => [name, (await this.addressBook.findByName(name)).id] as const)).then(
      (pairs) => new Map(pairs),
    );
    return this.addressIds;
  }

  /**
   * Every page's contribution up to and including `page`, folded in journey
   * order. Later pages win, so a field answered twice keeps the later value, and
   * a page that writes nothing of its own — accompanying documents, which live in
   * the document service — contributes nothing.
   */
  private async aggregateThrough(page: JourneyPage): Promise<Record<string, unknown>> {
    const contributions = journeyPages.slice(0, journeyPages.indexOf(page) + 1).flatMap((journeyPage) => {
      const contribution = journeyContributions[journeyPage];
      if (contribution) return [contribution];
      if (PAGES_WITHOUT_CONTRIBUTIONS.includes(journeyPage)) return [];
      throw new Error(`No recorded contribution for "${journeyPage}" — re-record with: npm run contributions:update`);
    });
    const notification = Object.assign({}, ...contributions.map((contribution) => contribution.notification)) as Record<string, unknown>;
    const entries = contributions.flatMap((contribution) => contribution.fulfilments);
    const fulfilments = [...new Map(entries.map((entry) => [entry.obligationId, entry])).values()];
    const addressIds = await this.resolvedAddressIds();
    return resolveTokens({ ...notification, fulfilments }, addressIds) as Record<string, unknown>;
  }

  private async mintNotification(notification: Record<string, unknown> = { fulfilments: [] }): Promise<NotificationFulfilments> {
    const n = await this.api.createNotification(notification, defaultActor);
    return {
      referenceNumber: n.referenceNumber,
      status: n.status,
      created: n.created,
      submittedAt: n.submittedAt ?? null,
      fulfilments: n.fulfilments ?? [],
    };
  }

  async createEmptyNotification(): Promise<NotificationFulfilments> {
    return this.remember(await this.mintNotification());
  }

  /** Inclusive of `page` itself. */
  async createUpToPage(page: JourneyPage): Promise<NotificationFulfilments> {
    return this.remember(await this.mintNotification(await this.aggregateThrough(page)));
  }

  /** A DRAFT with every journey page answered — what the UI journey submits. */
  async createFullNotification(): Promise<NotificationFulfilments> {
    return this.createUpToPage('contactAddress');
  }

  async createSubmittedNotification(): Promise<NotificationFulfilments> {
    const draft = await this.createFullNotification();
    await this.api.submitNotification(draft.referenceNumber, defaultActor);
    return this.remember({ ...draft, status: 'SUBMITTED' });
  }

  async createAmendNotification(): Promise<NotificationFulfilments> {
    const submitted = await this.createSubmittedNotification();
    await this.api.amendNotification(submitted.referenceNumber, defaultActor);
    return this.remember({ ...submitted, status: 'AMEND' });
  }

  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor();
    return targetPage;
  }
}
