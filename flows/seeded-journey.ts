import type { Locator } from '@playwright/test';
import type { FrontendFormClient } from '@adapters/http/frontend-form-client';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { PARTY_NAMES, declarationStep, seedSteps, type PartyIds, type PartyRole, type SeedDepth } from '@domain/fixtures/seeded-journey';
import type { JourneyContext } from '@flows/journey';

const CREATE_PATH = '/notifications';
const CREATED_AT_ORIGIN = /^\/notifications\/(?<journeyId>[^/]+)\/origin$/;

/**
 * Seeds notifications by posting to the frontend's own save-and-continue
 * routes, one page at a time, so the frontend runs the obligation model and
 * writes both the notification document and the fulfilments blob.
 *
 * Seeding straight to the backend wrote only the blob, leaving every seeded
 * notification with an empty document and no actor: the dashboard card was
 * blank, the outbox event hollow and cancel-amend restored an empty baseline.
 * Nothing caught it, because a fulfilments-backed view renders fine.
 *
 * One post per page, because a save is a whole-record replace but a route
 * accepts only its own page's fields: a page can rebuild the whole document
 * from what is stored, but can only supply one page of new answers.
 */
export class SeededJourney {
  private parties: PartyIds | undefined;

  constructor(
    private readonly forms: FrontendFormClient,
    private readonly addressBook: AddressBookApiClient,
    private readonly context: JourneyContext,
  ) {}

  /** A notification that exists and nothing more — no answers, no obligations met. */
  async createEmptyNotification(): Promise<string> {
    const location = await this.forms.postForm(CREATE_PATH);
    const journeyId = CREATED_AT_ORIGIN.exec(location)?.groups?.journeyId;
    if (!journeyId) {
      throw new Error(`POST ${CREATE_PATH} redirected to "${location}", which is not a new notification's origin page.`);
    }
    return this.remember(journeyId);
  }

  /** A draft answered as far as `depth` takes it. */
  async createDraftNotification(depth: SeedDepth = 'readyToSubmit'): Promise<string> {
    const journeyId = await this.createEmptyNotification();
    for (const { slug, form } of seedSteps(await this.partyIds(), depth)) {
      await this.forms.postForm(`${CREATE_PATH}/${journeyId}/${slug}`, form);
    }
    return journeyId;
  }

  async createSubmittedNotification(): Promise<string> {
    const journeyId = await this.createDraftNotification('readyToSubmit');
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/${declarationStep.slug}`, declarationStep.form);
    return journeyId;
  }

  async createAmendNotification(): Promise<string> {
    const journeyId = await this.createSubmittedNotification();
    await this.amend(journeyId);
    return journeyId;
  }

  async amend(journeyId: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/amend`);
  }

  async cancelAmend(journeyId: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/cancel-amend`);
  }

  async softDelete(journeyId: string): Promise<void> {
    await this.forms.postForm(`${CREATE_PATH}/${journeyId}/delete`);
  }

  /** Open a seeded notification in the browser, on the page a spec came to drive. */
  async resumeInUi<T extends { open(journeyId: string): Promise<void>; heading: Locator }>(journeyId: string, targetPage: T): Promise<T> {
    await targetPage.open(journeyId);
    await targetPage.heading.waitFor();
    return targetPage;
  }

  /**
   * Resolved by name through the address book, once per journey, the way
   * globalSetup already does — so no address-book id is written down here.
   */
  private async partyIds(): Promise<PartyIds> {
    if (!this.parties) {
      const roles = Object.keys(PARTY_NAMES) as PartyRole[];
      const found = await Promise.all(roles.map((role) => this.addressBook.findByName(PARTY_NAMES[role])));
      this.parties = Object.fromEntries(roles.map((role, index) => [role, found[index].id])) as PartyIds;
    }
    return this.parties;
  }

  private remember(journeyId: string): string {
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }
}
