import { Page, Locator } from '@playwright/test';

export class AccompanyingDocumentsPage {
  readonly expectedUrl = '/accompanying-documents';
  readonly expectedHeading = 'Accompanying documents';
  readonly expectedUploadReceivedUrl = '/accompanying-documents/upload-received';

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
    return this.page.getByLabel('Upload a document');
  }

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
