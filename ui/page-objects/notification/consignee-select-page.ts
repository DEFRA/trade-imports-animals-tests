import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class ConsigneeSelectPage extends BasePage {
  readonly expectedUrl = '/consignees/select';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Search for a consignee' });
  }

  get groupSelectConsignee(): Locator {
    return this.page.getByRole('group', { name: 'Select a consignee' });
  }

  radioConsignee(name: string): Locator {
    return this.groupSelectConsignee.getByRole('radio', { name: new RegExp(name) });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummaryItems(): Locator {
    return this.page.locator('.govuk-error-summary__list li');
  }
}
