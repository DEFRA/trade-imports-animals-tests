import { type Locator, type Page } from '@playwright/test';
import type { DateInput } from '@domain/types/date-time-input';
import { NotificationPage } from '@page-objects/base/base-page';

export class AccompanyingDocumentsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'accompanying-documents');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Upload documents' });
  }

  get documentReference(): Locator {
    return this.page.getByLabel('Document reference');
  }

  get fileUpload(): Locator {
    return this.page.getByLabel('Upload a file');
  }

  get saveAndAddAnother(): Locator {
    return this.page.getByRole('button', { name: 'Save and add another' });
  }

  get continueButton(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  documentRow(reference: string): Locator {
    return this.page.locator('.govuk-table__row', { hasText: reference });
  }

  removeDocument(index: number): Locator {
    return this.page.getByRole('button', { name: `Remove document ${index}`, exact: true });
  }

  viewFile(index: number): Locator {
    return this.page.getByRole('link', { name: `View file for document ${index}` });
  }

  get refreshStatus(): Locator {
    return this.page.getByRole('link', { name: /Refresh/ });
  }

  async fillDocument(reference: string, issueDate: DateInput, filePath: string): Promise<void> {
    await this.documentReference.fill(reference);
    await this.page.getByLabel('Day').fill(issueDate.day);
    await this.page.getByLabel('Month').fill(issueDate.month);
    await this.page.getByLabel('Year').fill(issueDate.year);
    await this.fileUpload.setInputFiles(filePath);
  }
}
