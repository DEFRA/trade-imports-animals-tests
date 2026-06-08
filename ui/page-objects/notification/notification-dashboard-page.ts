import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class NotificationDashboardPage extends BasePage {
  readonly expectedUrl = '/';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Import notification service' });
  }

  get btnCreateNewNotification(): Locator {
    return this.page.getByRole('button', { name: 'Create an import notification' });
  }

  get totalResults(): Locator {
    return this.page.getByText(/\d+ Results/);
  }

  get notificationCards(): Locator {
    return this.page.locator('.govuk-summary-card');
  }

  private cardField(card: Locator, term: string): Locator {
    return card.locator('dt').filter({ hasText: term }).locator('xpath=following-sibling::dd[1]');
  }

  btnCopyAsNew(referenceNumber: string): Locator {
    return this.page.getByRole('button', { name: `Copy as new ${referenceNumber}` });
  }

  viewLink(referenceNumber: string): Locator {
    return this.page.getByRole('link', { name: `View ${referenceNumber}` });
  }

  notificationCard(index: number) {
    const card = this.notificationCards.nth(index);
    return {
      details: {
        heading: card.getByRole('heading', { level: 2 }),
        commodity: this.cardField(card, 'Commodity'),
        origin: this.cardField(card, 'Origin'),
        arrivalAtDestination: this.cardField(card, 'Arrival at destination'),
        consignee: this.cardField(card, 'Consignee'),
        consignor: this.cardField(card, 'Consignor'),
        status: this.cardField(card, 'Status'),
        dateCreated: card.getByText(/Date created:/),
      },
      actions: {
        copyAsNew: card.getByRole('button', { name: /Copy as new/ }),
        view: card.getByRole('link', { name: /View/ }),
      },
    };
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.navigateToFrontend('/');
    await this.signInWhenRequested(attemptSignIn);

    if (attemptSignIn) {
      // The auth stub can fail under concurrent load. If we don't land on the
      // dashboard within a short grace period, retry the whole auth flow once.
      try {
        await this.heading.waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        console.warn('Auth retry triggered — initial sign-in did not land on dashboard within 5s');
        await this.page.goto('/');
        await this.signInWhenRequested(true);
      }
    }
  }
}
