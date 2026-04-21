import { Page, Locator } from '@playwright/test';

export class AdminNotificationViewPage {
  constructor(private readonly page: Page) {}

  expectedUrl(ref: string): string {
    return `/notifications/${ref}`;
  }

  // ── Page-level ────────────────────────────────────────────────────────────

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get caption(): Locator {
    return this.page.locator('.govuk-caption-xl');
  }

  // ── Notification details ──────────────────────────────────────────────────

  get sectionNotificationDetails(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Notification details' });
  }

  get summaryReferenceNumber(): Locator {
    return this.summaryValue('Reference number');
  }

  get summaryCreated(): Locator {
    return this.summaryValue('Created');
  }

  get summaryUpdated(): Locator {
    return this.summaryValue('Updated');
  }

  // ── Origin ────────────────────────────────────────────────────────────────

  get sectionOrigin(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Origin' });
  }

  get summaryCountryCode(): Locator {
    return this.summaryValue('Country code');
  }

  get summaryRequiresRegionCode(): Locator {
    return this.summaryValue('Requires region code');
  }

  get summaryInternalReference(): Locator {
    return this.summaryValue('Internal reference');
  }

  // ── Commodity ─────────────────────────────────────────────────────────────

  get sectionCommodity(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Commodity' });
  }

  get summaryCommodityName(): Locator {
    return this.summaryValue('Commodity name');
  }

  get summaryReasonForImport(): Locator {
    return this.summaryValue('Reason for import');
  }

  // ── Additional details ────────────────────────────────────────────────────

  get sectionAdditionalDetails(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Additional details' });
  }

  get summaryCertifiedFor(): Locator {
    return this.summaryValue('Certified for');
  }

  get summaryUnweanedAnimals(): Locator {
    return this.summaryValue('Unweaned animals');
  }

  // ── Accompanying documents ────────────────────────────────────────────────

  get sectionAccompanyingDocuments(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Accompanying documents' });
  }

  /** All "Document N" sub-headings — count these to know how many documents are shown. */
  get documentHeadings(): Locator {
    return this.page.getByRole('heading', { level: 3, name: /^Document \d+$/ });
  }

  /** Shown when there are no accompanying documents. */
  get noDocumentsMessage(): Locator {
    return this.page.getByText('No accompanying documents uploaded.');
  }

  /**
   * Returns the section for a specific document by 1-based index.
   * Scoped from the "Document N" heading to the next heading of the same level,
   * so all summary rows within that block are accessible.
   */
  documentSection(index: number): Locator {
    return this.page.locator('.govuk-summary-list').nth(index + 1); // +1 to skip notification details list
  }

  /** Scan status tag ("Safe", "Virus found", "Pending") for document at 1-based index. */
  documentScanStatusTag(index: number): Locator {
    return this.documentSection(index).locator('.govuk-tag');
  }

  /** File download link(s) for document at 1-based index. */
  documentFileLinks(index: number): Locator {
    return this.documentSection(index).getByRole('link');
  }

  /**
   * Finds a document section by its reference value — useful when you know
   * which document should or should not be present.
   */
  documentSectionByReference(reference: string): Locator {
    return this.page
      .locator('.govuk-summary-list')
      .filter({ has: this.page.locator('.govuk-summary-list__value', { hasText: reference }) });
  }

  /** Scan status tag for the document with the given reference value. */
  documentScanStatusByReference(reference: string): Locator {
    return this.documentSectionByReference(reference).locator('.govuk-tag');
  }

  /** File download link(s) for the document with the given reference value. */
  documentFileLinkByReference(reference: string): Locator {
    return this.documentSectionByReference(reference).getByRole('link');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Gets the value cell for a summary list row by key text. */
  private summaryValue(key: string): Locator {
    return this.page
      .locator('.govuk-summary-list__row')
      .filter({ has: this.page.locator('.govuk-summary-list__key', { hasText: key }) })
      .locator('.govuk-summary-list__value');
  }
}
