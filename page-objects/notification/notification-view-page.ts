import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class NotificationViewPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'notification-view');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Check your answers' });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  get referenceNumberCaption(): Locator {
    return this.journeyStrip;
  }

  get btnAmend(): Locator {
    return this.page.getByRole('button', { name: 'Amend' });
  }

  get btnCopyAsNew(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new' });
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get cancelAmendment(): Locator {
    return this.page.getByRole('link', { name: 'Cancel amendment' });
  }

  changeLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name });
  }

  summaryCard(name: string): Locator {
    return this.page.locator('.govuk-summary-card', { hasText: name });
  }

  async open(journeyId: string, attemptSignIn: boolean = true): Promise<void> {
    await super.open(journeyId, attemptSignIn);
    if (attemptSignIn) await this.heading.waitFor();
  }
}
