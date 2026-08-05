import { test, expect } from '@fixtures';

test.describe('Addresses picker', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the picker searches and pages the address book, and the row selected on a later page is the one that saves', async ({
    journey,
    pages,
  }) => {
    const page = pages.page;
    // Happy-path consignor record — appears on page one of the book.
    const consignorName = 'Astra Rosales';

    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Roles and addresses').click();
    const consignorRow = pages.addresses.partyRow('Consignor or exporter');
    await pages.addresses.addParty('Consignor or exporter').click();

    // The book opens on page 1 — five of its ~forty records. It is a shared,
    // mutable server book: repeated runs against a persistent stack append
    // records to its END, so both the total and the page count are matched from
    // what the page actually shows, never a literal.
    const showingFive = /Showing 5 of \d+ addresses/;
    await expect(page.getByText(showingFive)).toBeVisible();
    await expect(pages.consignorSelection.party(consignorName)).toBeVisible();

    // View details expands the row in place (no navigation, so nothing typed or
    // ticked is lost) and shows the rest of the record.
    const danishRow = page.locator('tr', { hasText: 'Danish Meat Export ApS' });
    const danishDetails = danishRow.locator('details');
    await expect(danishDetails.locator('.govuk-details__text')).toBeHidden();
    await danishDetails.locator('summary').click();
    await expect(danishDetails.locator('.govuk-details__text')).toBeVisible();
    await expect(danishDetails).toContainText('Copenhagen');

    // Search is a server round-trip over the whole book and narrows it to a
    // single page of results.
    await pages.consignorSelection.search.fill('Denmark');
    await pages.consignorSelection.searchButton.click();
    await expect(page.getByText('Showing 2 of 2 addresses')).toBeVisible();
    await expect(pages.consignorSelection.party('Jutland Swine ApS')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveCount(0);

    // Clearing the search restores the whole book and its pagination.
    await pages.consignorSelection.search.fill('');
    await pages.consignorSelection.searchButton.click();
    await expect(page.getByText(showingFive)).toBeVisible();

    // GDS pagination renders a WINDOW, not every page: from page 1 that is
    // 1, 2, an ellipsis and the last page — so page 3 is reached by stepping
    // through the neighbours the component actually offers. The last page is
    // derived from the current total (5 per page), not a fixed number, because
    // the book grows as records are appended.
    const showingText = (await page.getByText(showingFive).textContent()) ?? '';
    const total = Number(showingText.match(/of (\d+)/)?.[1] ?? 0);
    const lastPage = Math.ceil(total / 5);
    await expect(page.getByRole('link', { name: `Page ${lastPage}` })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 3' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Page 2' }).click();

    // Page three holds records that page one never rendered.
    await page.getByRole('link', { name: 'Page 3' }).click();
    await expect(pages.consignorSelection.party('Irish Beef Traders Ltd')).toBeVisible();
    await expect(pages.consignorSelection.party(consignorName)).toHaveCount(0);

    // Selecting there and saving copies THAT record onto the consignor.
    await pages.consignorSelection.party('Iberian Swine SA').check();
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText('Iberian Swine SA');

    // Re-entering opens on page one, where the chosen record is not rendered —
    // the picker still knows it (carried, not re-ticked), and a save from this
    // page keeps it. That is the no-JS selection-across-pagination guarantee.
    await consignorRow.getByRole('link', { name: 'Change' }).click();
    await expect(page.getByText('Selected address: Iberian Swine SA')).toBeVisible();
    await expect(pages.consignorSelection.party('Iberian Swine SA')).toHaveCount(0);
    await pages.consignorSelection.saveAndContinue.click();
    await expect(pages.addresses.heading).toBeVisible();
    await expect(consignorRow).toContainText('Iberian Swine SA');
  });
});
