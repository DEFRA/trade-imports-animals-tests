import { Page, Locator } from '@playwright/test';
import { documentTypes, type DocumentType } from '@main-domain/constants/document-types';
import type { DateInput } from '@main-domain/types/date-time-input';
import { getRelativeDateInput } from '@main-utils/date-utils';

export class AccompanyingDocumentsPage {
  readonly expectedUrl = '/accompanying-documents';
  readonly expectedHeading = 'Accompanying documents';

  constructor(private readonly page: Page) {}

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: this.expectedHeading });
  }

  get dropdownDocumentType(): Locator {
    return this.page.getByRole('combobox', { name: 'Document type' });
  }

  get inputDocumentReference(): Locator {
    return this.page.getByRole('textbox', { name: 'Document reference' });
  }

  get inputIssueDateDay(): Locator {
    return this.page.getByRole('textbox', { name: 'Day' });
  }

  get inputIssueDateMonth(): Locator {
    return this.page.getByRole('textbox', { name: 'Month' });
  }

  get inputIssueDateYear(): Locator {
    return this.page.getByRole('textbox', { name: 'Year' });
  }

  get inputFileUpload(): Locator {
    return this.page.getByLabel('Attachment');
  }

  get btnAddAttachment(): Locator {
    return this.page.getByRole('button', { name: 'Add attachment' });
  }

  // When document(s) are not uploaded
  get btnContinueWithoutDocuments(): Locator {
    return this.page.getByRole('button', { name: 'Continue without documents' });
  }

  // When document(s) are uploaded
  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummaryItems(): Locator {
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) })
      .getByRole('link');
  }

  get errorDocumentType(): Locator {
    return this.page.locator('#documentType-error');
  }

  get errorDocumentReference(): Locator {
    return this.page.locator('#documentReference-error');
  }

  get errorIssueDate(): Locator {
    return this.page.locator('#issueDate-error');
  }

  get errorFile(): Locator {
    return this.page.locator('#file-error');
  }

  get documentsList(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Documents added' });
  }

  get documentRows(): Locator {
    return this.page.locator('[data-testid="document-card"][data-upload-id]');
  }

  getDocumentRow(filename: string): Locator {
    return this.page.locator('[data-testid="document-card"][data-upload-id]').filter({ hasText: filename });
  }

  getStatusTag(filename: string): Locator {
    return this.getDocumentRow(filename).locator('.govuk-tag');
  }

  getBtnRemove(filename: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${filename}` });
  }

  // Manual “refresh status” link while the virus check is still running; for users without automatic page updates (e.g. JavaScript off).
  get linkRefreshVirusScanStatus(): Locator {
    return this.page.getByRole('link', { name: 'Refresh virus scan status' });
  }

  // Only rendered once the scan is COMPLETE.
  getViewFileLink(filename: string): Locator {
    return this.getDocumentRow(filename).getByRole('link', { name: `View file ${filename}` });
  }

  async fillIssueDate(date: DateInput): Promise<void> {
    await this.inputIssueDateDay.fill(date.day);
    await this.inputIssueDateMonth.fill(date.month);
    await this.inputIssueDateYear.fill(date.year);
  }

  async fillTextFields(
    options: {
      documentType?: DocumentType;
      documentReference?: string;
      issueDate?: DateInput;
    } = {},
  ): Promise<void> {
    const {
      documentType = documentTypes.itahc,
      documentReference = 'ITAHC001',
      issueDate = getRelativeDateInput({ monthOffset: -6 }),
    } = options;

    await this.dropdownDocumentType.selectOption(documentType);
    await this.inputDocumentReference.fill(documentReference);
    await this.fillIssueDate(issueDate);
  }
}
