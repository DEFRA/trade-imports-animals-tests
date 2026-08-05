import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantAccompanyingDocumentsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'accompanying-documents', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Accompanying documents' });
  }

  get documentType(): Locator {
    return this.page.getByLabel('Document type');
  }

  get documentReference(): Locator {
    return this.page.getByLabel('Document reference');
  }

  get issueDate(): Locator {
    return this.page.getByLabel('Date of issue');
  }

  get addDocument(): Locator {
    return this.page.getByRole('button', { name: 'Add document' });
  }

  removeDocument(type: string, reference: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${type} ${reference}`, exact: true });
  }

  get summaryRows(): Locator {
    return this.page.locator('main').getByRole('table', { name: 'Documents you have added' }).getByRole('row');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
