import type { Locator } from '@playwright/test';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import type { NotificationFulfilments, PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';
import type { PageObjects } from '@page-objects';
import type { JourneyContext } from '@flows/journey';

export const journeyPages = [
  'originOfImport',
  'commoditySelection',
  'consignmentDetails',
  'animalIdentification',
  'importReason',
  'additionalDetails',
  'accompanyingDocuments',
  'addresses',
  'arrivalDetails',
  'transitedCountries',
  'transporter',
  'contactAddress',
] as const satisfies readonly (keyof PageObjects)[];

export type JourneyPage = (typeof journeyPages)[number];

const scalar = (obligationId: string, value: unknown): PersistedFulfilmentEntry => ({
  obligationId,
  value,
});

const record = (obligationId: string, fulfilmentId: string, value: unknown): PersistedFulfilmentEntry => ({
  obligationId,
  records: [{ fulfilmentId, value }],
});

// Obligation UUIDs mirror the frontend obligation model — keep in step with
// repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/
const COUNTRY_OF_ORIGIN = 'a01b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const REGION_OF_ORIGIN_CODE_REQUIREMENT = 'b12c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e';
const REGION_OF_ORIGIN_CODE = 'c23d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f';
const INTERNAL_REFERENCE_NUMBER = '10e5f607-1829-4a3b-84c5-06d7e8f9a0b1';
const COMMODITY_SELECTION = '21f60718-192a-4d4e-8bcd-17e8f9a0b1c3';
const COMMODITY_TYPE = '22071829-2a3b-4e5f-8cde-28f9a0b1c2d4';
const SPECIES_SELECTION = '2318293a-3b4c-4f60-8def-39a0b1c2d3e5';
const NUMBER_OF_ANIMALS = '24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6';
const NUMBER_OF_PACKAGES = '252a3b4c-5d6e-4b82-8f01-5bc2d3e4f507';

// Captured verbatim from a real UI unlock (startNotification + answerOrigin + answerCommodity), not
// invented — Mapper A projects the commodity code to a string, so an invented array value makes the
// first UI save's POST /notifications fail deserialization. Keep in step with journey.ts's unlock.
const UNLOCKED_FULFILMENTS: PersistedFulfilmentEntry[] = [
  scalar(COUNTRY_OF_ORIGIN, 'FR'),
  scalar(REGION_OF_ORIGIN_CODE_REQUIREMENT, 'no'),
  scalar(REGION_OF_ORIGIN_CODE, ''),
  scalar(INTERNAL_REFERENCE_NUMBER, ''),
  record(COMMODITY_SELECTION, 'line0', 'Cow'),
  record(COMMODITY_TYPE, 'line0', '16'),
  record(SPECIES_SELECTION, 'line0', '1148346'),
  record(NUMBER_OF_ANIMALS, 'line0', 1),
  record(NUMBER_OF_PACKAGES, 'line0', '5'),
];

export class ApiJourney {
  constructor(
    private readonly pages: PageObjects,
    private readonly api: NotificationApiClient,
    private readonly context: JourneyContext,
  ) {}

  private remember(aggregate: NotificationFulfilments): NotificationFulfilments {
    this.context.journeyId = aggregate.id;
    this.context.referenceNumber = aggregate.id;
    return aggregate;
  }

  private async mintNotification(contents: PersistedFulfilmentEntry[] = []): Promise<NotificationFulfilments> {
    const n = await this.api.createNotification({ fulfilments: contents });
    return {
      id: n.referenceNumber,
      status: n.status,
      createdAt: n.created,
      submittedAt: n.submittedAt ?? null,
      fulfilments: n.fulfilments ?? [],
    };
  }

  async createEmptyNotification(): Promise<NotificationFulfilments> {
    return this.remember(await this.mintNotification());
  }

  async createFullNotification(): Promise<NotificationFulfilments> {
    return this.remember(await this.mintNotification(UNLOCKED_FULFILMENTS));
  }

  async createUpToPage(): Promise<NotificationFulfilments> {
    return this.createFullNotification();
  }

  async createSubmittedNotification(): Promise<NotificationFulfilments> {
    const draft = await this.createFullNotification();
    await this.api.submitNotification(draft.id);
    return this.remember({ ...draft, status: 'SUBMITTED' });
  }

  async createAmendNotification(): Promise<NotificationFulfilments> {
    const submitted = await this.createSubmittedNotification();
    await this.api.amendNotification(submitted.id);
    return this.remember({ ...submitted, status: 'AMEND' });
  }

  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor();
    return targetPage;
  }
}
