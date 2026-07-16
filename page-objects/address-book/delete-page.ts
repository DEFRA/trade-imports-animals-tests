import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class DeleteOperatorPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Delete operator' });
  }

  get confirmationText(): Locator {
    return this.page.getByText(/^Are you sure you want to delete/);
  }

  get warning(): Locator {
    return this.page.locator('.govuk-warning-text');
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }
}
