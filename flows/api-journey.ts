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

const UNLOCKED_FULFILMENT: PersistedFulfilmentEntry[] = [
  scalar('a01b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', 'FR'),
  scalar('b12c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e', 'no'),
  record('21f60718-192a-4d4e-8bcd-17e8f9a0b1c3', 'line0', 'Cat'),
  record('22071829-2a3b-4e5f-8cde-28f9a0b1c2d4', 'line0', '16'),
  record('2318293a-3b4c-4f60-8def-39a0b1c2d3e5', 'line0', ['749313']),
  record('24192a3b-4c5d-4a71-8ef0-4ab1c2d3e4f6', 'line0', '1'),
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

  async createEmptyNotification(): Promise<Fulfilment> {
    return this.remember(await this.api.createFulfilment());
  }

  async createFullNotification(): Promise<Fulfilment> {
    const created = await this.api.createFulfilment();
    return this.remember(await this.api.replaceFulfilment(created.id, UNLOCKED_FULFILMENT));
  }

  async createUpToPage(): Promise<Fulfilment> {
    return this.createFullNotification();
  }

  async createSubmittedNotification(): Promise<Fulfilment> {
    const draft = await this.createFullNotification();
    return this.remember(await this.api.submitNotification(draft.id));
  }

  async createAmendNotification(): Promise<Fulfilment> {
    const submitted = await this.createSubmittedNotification();
    return this.remember(await this.api.amendNotification(submitted.id));
  }

  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor();
    return targetPage;
  }
}
