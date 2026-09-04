import type { Locator } from '@playwright/test';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import { DEFAULT_ACTOR } from '@domain/constants/actor';
import {
  SEEDED_PARTY_NAMES,
  seededFulfilments,
  seededNotification,
  type SeededPartyIds,
  type SeededPartyRole,
} from '@domain/fixtures/seeded-notification';
import type { Notification } from '@domain/models/api/notification';
import type { NotificationFulfilments } from '@domain/models/api/notification-fulfilments';
import type { JourneyContext } from '@flows/journey';

/**
 * Seeds a notification through the API instead of the UI, for specs where the
 * notification is scenery rather than subject.
 *
 * It mints the record the way the frontend does — an empty create for the
 * reference number, then one save carrying both the fulfilments payload and the
 * notification document — so what lands in Mongo is what a completed journey
 * would have left there. Seeding half of that once left the document empty,
 * which passed on the notification view (fulfilments-backed) while the
 * dashboard showed a blank card, every GBN-AG event carried an empty
 * consignment, and cancel-amend restored an empty baseline over a real one.
 *
 * @see {@link file://./../domain/fixtures/seeded-notification.ts} for the payloads
 */

function required<T>(value: T | undefined | null, field: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Notification API response is missing ${field}`);
  }
  return value;
}

export class ApiJourney {
  private partyIds?: Promise<SeededPartyIds>;

  constructor(
    private readonly api: NotificationApiClient,
    private readonly addressBook: AddressBookApiClient,
    private readonly context: JourneyContext,
  ) {}

  /**
   * The address-book ids standing behind the journey's parties. Mongo mints
   * them when globalSetup seeds the fixtures, so they have to be looked up by
   * name — once per instance, however many notifications the test seeds.
   */
  private parties(): Promise<SeededPartyIds> {
    this.partyIds ??= this.lookUpParties();
    return this.partyIds;
  }

  private async lookUpParties(): Promise<SeededPartyIds> {
    const roles = Object.entries(SEEDED_PARTY_NAMES) as [SeededPartyRole, string][];
    const resolved = await Promise.all(roles.map(async ([role, name]) => [role, (await this.addressBook.findByName(name)).id] as const));
    return Object.fromEntries(resolved) as SeededPartyIds;
  }

  private remember(aggregate: NotificationFulfilments): NotificationFulfilments {
    this.context.journeyId = aggregate.referenceNumber;
    this.context.referenceNumber = aggregate.referenceNumber;
    return aggregate;
  }

  /** The notification as the fulfilments view returns it, which is what specs read. */
  private asFulfilments(notification: Notification): NotificationFulfilments {
    return {
      referenceNumber: required(notification.referenceNumber, 'referenceNumber'),
      status: required(notification.status, 'status'),
      created: required(notification.created, 'created'),
      submittedAt: notification.submittedAt ?? null,
      fulfilments: notification.fulfilments ?? [],
    };
  }

  /**
   * A notification carrying every answer a completed journey has, written the
   * way the frontend writes one: create, then save both payloads together.
   */
  private async mintNotification(): Promise<NotificationFulfilments> {
    const parties = await this.parties();
    const created = await this.api.createNotification({ fulfilments: [] }, DEFAULT_ACTOR);
    const saved = await this.api.saveNotification(
      required(created.referenceNumber, 'referenceNumber'),
      required(created.concurrencyToken, 'concurrencyToken'),
      { ...seededNotification(parties), fulfilments: seededFulfilments(parties) },
      DEFAULT_ACTOR,
    );
    return this.asFulfilments(saved);
  }

  /** A notification with nothing answered, as the Create button leaves one. */
  async createEmptyNotification(): Promise<NotificationFulfilments> {
    return this.remember(this.asFulfilments(await this.api.createNotification({ fulfilments: [] }, DEFAULT_ACTOR)));
  }

  async createFullNotification(): Promise<NotificationFulfilments> {
    return this.remember(await this.mintNotification());
  }

  async createSubmittedNotification(): Promise<NotificationFulfilments> {
    const draft = await this.createFullNotification();
    await this.api.submitNotification(draft.referenceNumber, DEFAULT_ACTOR);
    return this.remember({ ...draft, status: 'SUBMITTED' });
  }

  async createAmendNotification(): Promise<NotificationFulfilments> {
    const submitted = await this.createSubmittedNotification();
    await this.api.amendNotification(submitted.referenceNumber, DEFAULT_ACTOR);
    return this.remember({ ...submitted, status: 'AMEND' });
  }

  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor();
    return targetPage;
  }
}
