import { Page, Locator } from '@playwright/test';

export class UploadReceivedPage {
  readonly expectedUrl = '/accompanying-documents/upload-received';

  constructor(private readonly page: Page) {}

  get panelSuccess(): Locator {
    return this.page.getByRole('heading', { name: 'Document uploaded successfully' });
  }

  get headingChecking(): Locator {
    return this.page.getByRole('heading', { name: 'Your document is being checked' });
  }

  get headingTimedOut(): Locator {
    return this.page.getByRole('heading', { name: 'This is taking longer than expected' });
  }

  get btnContinue(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get btnTryAgain(): Locator {
    return this.page.getByRole('button', { name: 'Try again' });
  }

  get errorVirusSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }
}
