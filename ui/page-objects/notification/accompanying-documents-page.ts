import { Page, Locator } from '@playwright/test';

export class AccompanyingDocumentsPage {
  readonly expectedUrl = '/accompanying-documents';
  readonly expectedHeading = 'Accompanying documents';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
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

  /** The "Add attachment" button that submits the add-document form. */
  get btnUploadDocument(): Locator {
    return this.page.getByRole('button', { name: 'Add attachment' });
  }

  /**
   * The continue button at the bottom of the page. Reads "Continue without documents"
   * while the list is empty and "Save and continue" once any document has been added.
   * Always rendered, but disabled until all scans have completed without a virus.
   */
  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: /^(Save and continue|Continue without documents)$/ });
  }

  /** Locator for the continue button when it is enabled (neither native disabled nor aria-disabled). */
  get btnContinueEnabled(): Locator {
    return this.btnContinue.and(this.page.locator(':not([disabled]):not([aria-disabled="true"])'));
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

  /** The "Documents added" heading — present once at least one document has been uploaded. */
  get documentsList(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Documents added' });
  }

  /** All document cards in the uploaded-documents list. */
  get documentRows(): Locator {
    return this.page.locator('[data-testid="document-card"][data-upload-id]');
  }

  /** The application reference number caption shown at the top of the page. */
  get referenceNumberCaption(): Locator {
    return this.page.getByTestId('app-reference-number-caption');
  }

  /** A single document card, identified by filename. */
  getDocumentRow(filename: string): Locator {
    return this.page.locator('[data-testid="document-card"][data-upload-id]').filter({ hasText: filename });
  }

  /** The GOV.UK tag showing scan status for a given filename. */
  getStatusTag(filename: string): Locator {
    return this.getDocumentRow(filename).locator('.govuk-tag');
  }

  /** The "Remove" button for a given filename. */
  getBtnRemove(filename: string): Locator {
    return this.page.getByRole('button', { name: `Remove ${filename}` });
  }

  /** The "View file" link for a given filename — only rendered once the scan is COMPLETE. */
  getViewFileLink(filename: string): Locator {
    return this.getDocumentRow(filename).getByRole('link', { name: `View file ${filename}` });
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
    const {
      documentType = 'ITAHC',
      documentReference = 'ITAHC001',
      day = '15',
      month = '01',
      year = new Date().getFullYear().toString(),
    } = options;

    await this.dropdownDocumentType.selectOption(documentType);
    await this.inputDocumentReference.fill(documentReference);
    await this.inputIssueDateDay.fill(day);
    await this.inputIssueDateMonth.fill(month);
    await this.inputIssueDateYear.fill(year);
  }
}
