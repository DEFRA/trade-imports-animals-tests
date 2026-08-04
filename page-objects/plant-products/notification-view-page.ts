import { type Locator, type Page } from '@playwright/test';
import { ReviewNotificationPage } from '@page-objects/plant-products/review-notification-page';

// Plant products uses review-notification in read-only mode rather than a separate view feature.
export class PlantNotificationViewPage extends ReviewNotificationPage {
  constructor(page: Page) {
    super(page);
  }

  get copy(): Locator {
    return this.page.getByRole('button', { name: 'Copy as new', exact: true });
  }

  get delete(): Locator {
    return this.page.getByRole('button', { name: 'Delete', exact: true });
  }

  get cancelAmend(): Locator {
    return this.page.getByRole('link', { name: 'Cancel amendment', exact: true });
  }

  get copyForm(): Locator {
    return this.copy.locator('..');
  }

  get idempotencyKey(): Locator {
    return this.copyForm.locator('input[name="idempotencyKey"]');
  }

  get copyOrigin(): Locator {
    return this.copyForm.locator('input[name="copyOrigin"]');
  }
}
