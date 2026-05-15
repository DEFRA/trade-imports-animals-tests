import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class TransporterPage extends BasePage {
  readonly expectedUrl = '/transporter';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get captionTransport(): Locator {
    return this.page.locator('span.govuk-caption-m').filter({ hasText: /^Transport$/ });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Transporter' });
  }

  get linkTransportGuidance(): Locator {
    return this.page.getByRole('link', {
      name: 'Find out how to transport animals in connection with an economic activity (opens in new tab)',
    });
  }

  get linkAddTransporter(): Locator {
    return this.page.locator('#addTransporter');
  }

  get tableTransporter(): Locator {
    return this.page.getByRole('table');
  }

  get rowsTransporter(): Locator {
    return this.tableTransporter.locator('tbody').getByRole('row');
  }

  get cellsTransporter(): Locator {
    return this.rowsTransporter.first().getByRole('cell');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
