import { Page, Locator } from '@playwright/test';

export class AccompanyingDocumentsPage {
  readonly expectedUrl = '/accompanying-documents';
  readonly expectedHeading = 'Accompanying documents';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
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

  /** The "Add attachment" button that submits the add-document form. */
  get btnUploadDocument(): Locator {
    return this.page.getByRole('button', { name: 'Add attachment' });
  }

  /**
   * The "Save and continue" button — always rendered, but disabled until at least
   * one document has been uploaded and all scans have completed without a virus.
   */
  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  /** True when Save and continue is enabled (not aria-disabled). */
  get btnSaveAndContinueEnabled(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' }).and(this.page.locator(':not([aria-disabled="true"])'));
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

  /** The summary list table showing uploaded documents and their scan statuses. */
  get documentsTable(): Locator {
    return this.page.locator('.govuk-summary-list');
  }

  /** A single row in the documents table, identified by filename. */
  getDocumentRow(filename: string): Locator {
    return this.page.locator('.govuk-summary-list__row').filter({ hasText: filename });
  }

  /** The GOV.UK tag showing scan status for a given filename. */
  getStatusTag(filename: string): Locator {
    return this.getDocumentRow(filename).locator('.govuk-tag');
  }

  /** The "Remove" button for a given filename. */
  getBtnRemove(filename: string): Locator {
    return this.getDocumentRow(filename).getByRole('button', { name: /Remove/ });
  }

  async fillTextFields(
    options: {
      documentType?: string;
      documentReference?: string;
      day?: string;
      month?: string;
      year?: string;
    } = {},
  ): Promise<void> {
    const { documentType = 'ITAHC', documentReference = 'ITAHC001', day = '15', month = '01', year = '2024' } = options;

    await this.dropdownDocumentType.selectOption(documentType);
    await this.inputDocumentReference.fill(documentReference);
    await this.inputIssueDateDay.fill(day);
    await this.inputIssueDateMonth.fill(month);
    await this.inputIssueDateYear.fill(year);
  }
}
