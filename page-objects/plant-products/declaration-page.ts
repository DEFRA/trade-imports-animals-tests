import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantDeclarationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'declaration', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Declaration' });
  }

  get declaration(): Locator {
    return this.page.getByRole('checkbox', { name: /I\/We have read and understood the Conditions/ });
  }

  get submitNotification(): Locator {
    return this.page.getByRole('button', { name: 'Submit notification' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
