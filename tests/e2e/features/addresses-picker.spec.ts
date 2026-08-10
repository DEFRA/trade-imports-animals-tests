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

    // The book opens on page 1 — five of the organisation's records, seeded by
    // seeds/mongodb/30-seed-address-book.js. It is a shared, mutable SERVER
    // book now, not a list inside the frontend: a run that adds an address
    // grows it, so both the total and the page count are matched from what the
    // page actually shows, never a literal.
    const showingFive = /Showing 5 of \d+ addresses/;
    await expect(page.getByText(showingFive)).toBeVisible();
    await expect(pages.consignorSelection.party(consignorName)).toBeVisible();

    // View details expands the row in place (no navigation, so nothing typed or
    // ticked is lost) and shows the rest of the record.
    const detailedRow = page.locator('tr', { hasText: 'Tech Imports Ltd' });
    const rowDetails = detailedRow.locator('details');
    await expect(rowDetails.locator('.govuk-details__text')).toBeHidden();
    await rowDetails.locator('summary').click();
    await expect(rowDetails.locator('.govuk-details__text')).toBeVisible();
    await expect(rowDetails).toContainText('London');

    // Search is a server round-trip over the whole book and narrows it to a
    // single page of results. The address book matches name, town and postcode
    // — not country — so this searches on a fragment of the two Danish names.
    await pages.consignorSelection.search.fill('ApS');
    await pages.consignorSelection.searchButton.click();
    await expect(page.getByText('Showing 2 of 2 addresses')).toBeVisible();
    await expect(pages.consignorSelection.party('Jutland Swine ApS')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveCount(0);

    // Clearing the search restores the whole book and its pagination.
    await pages.consignorSelection.search.fill('');
    await pages.consignorSelection.searchButton.click();
    await expect(page.getByText(showingFive)).toBeVisible();

    // The last page is derived from the current total (5 per page), not a fixed
    // number, because the book grows as records are appended by other specs.
    const showingText = (await page.getByText(showingFive).textContent()) ?? '';
    const total = Number(showingText.match(/of (\d+)/)?.[1] ?? 0);
    const lastPage = Math.ceil(total / 5);
    await expect(page.getByRole('link', { name: `Page ${lastPage}` })).toBeVisible();

    // Page three holds records that page one never rendered. From page 1 the
    // pagination window is {1, 2, last}, so Page 3 is only linked once we are
    // on page 2 (window {1, 2, 3, last}).
    await page.getByRole('link', { name: 'Page 2' }).click();
    await page.getByRole('link', { name: 'Page 3' }).click();
    await expect(pages.consignorSelection.party('Irish Beef Traders Ltd')).toBeVisible();
    await expect(pages.consignorSelection.party(consignorName)).toHaveCount(0);

    // Selecting there and saving LINKS the consignor to that record — the
    // notification stores its id, and the name shown is read back from the
    // address book on every render (EUDPA-294).
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
