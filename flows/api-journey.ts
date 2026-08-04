import type { Locator } from '@playwright/test';
import { NotificationApiClient } from '@adapters/http/notification-api-client';
import type { Fulfilment, PersistedFulfilmentEntry } from '@domain/models/api/fulfilment';
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

// Captured verbatim from a real UI unlock (startNotification + answerOrigin + answerCommodity), not
// invented — Mapper A projects the commodity code to a string, so an invented array value makes the
// first UI save's POST /notifications fail deserialization. Keep in step with journey.ts's unlock.
const UNLOCKED_FULFILMENT: PersistedFulfilmentEntry[] = [
  scalar('a01b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', 'FR'),
  scalar('b12c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e', 'no'),
  scalar('c23d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f', ''),
  scalar('10e5f607-1829-4a3b-84c5-06d7e8f9a0b1', ''),
  record('21f60718-192a-4d4e-8bcd-17e8f9a0b1c3', 'line0', 'Cow'),
  record('22071829-2a3b-4e5f-8cde-28f9a0b1c2d4', 'line0', '16'),
  record('2318293a-3b4c-4f60-8def-39a0b1c2d3e5', 'line0', '1148346'),
  record('24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6', 'line0', 1),
  record('252a3b4c-5d6e-4b82-8f01-5bc2d3e4f507', 'line0', '5'),
];

export class ApiJourney {
  constructor(
    private readonly pages: PageObjects,
    private readonly api: NotificationApiClient,
    private readonly context: JourneyContext,
  ) {}

  private remember(fulfilment: Fulfilment): Fulfilment {
    this.context.journeyId = fulfilment.id;
    this.context.referenceNumber = fulfilment.id;
    return fulfilment;
  }

  // Notification mints the reference number (main's saveOriginOfImport with blank ref),
  // and the fulfilment is bootstrapped at that same ref. Matches the frontend's own
  // create flow post-cascade-removal.
  private async mintNotificationAndBootstrapFulfilment(fulfilmentContent: PersistedFulfilmentEntry[] = []): Promise<Fulfilment> {
    const notification = await this.api.createNotification();
    return this.api.replaceFulfilment(notification.referenceNumber, fulfilmentContent);
  }

  async createEmptyNotification(): Promise<Fulfilment> {
    return this.remember(await this.mintNotificationAndBootstrapFulfilment());
  }

  async createFullNotification(): Promise<Fulfilment> {
    return this.remember(await this.mintNotificationAndBootstrapFulfilment(UNLOCKED_FULFILMENT));
  }

  async createUpToPage(): Promise<Fulfilment> {
    return this.createFullNotification();
  }

  async createSubmittedNotification(): Promise<Fulfilment> {
    const draft = await this.createFullNotification();
    await this.api.submitFulfilment(draft.id);
    await this.api.submitNotification(draft.id);
    return this.remember({ ...draft, status: 'SUBMITTED' });
  }

  async createAmendNotification(): Promise<Fulfilment> {
    const submitted = await this.createSubmittedNotification();
    await this.api.amendFulfilment(submitted.id);
    await this.api.amendNotification(submitted.id);
    return this.remember({ ...submitted, status: 'AMEND' });
  }

  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor();
    return targetPage;
  }
}
