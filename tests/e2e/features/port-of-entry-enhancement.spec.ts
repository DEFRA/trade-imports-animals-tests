import { test, expect } from '@fixtures';

const PORT_OPTION = 'Aberdeen Harbour (GB ABD)';
const PORT_CODE = 'GB ABD';
const ARRIVAL_DATE = '12/12/2026';

test.describe('Port of entry accessible-autocomplete enhancement', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('name and code search both suggest, and selection persists the code', async ({ journey, pages }) => {
    await journey.toArrivalDetails();
    const journeyId = pages.arrivalDetails.journeyIdFromUrl();

    // The enhancement swaps the visible affordance to a combobox input while
    // the select stays in the DOM (renamed) as the control that submits.
    const combo = pages.arrivalDetails.portOfEntry;
    const select = pages.page.locator('select#portOfEntry-select');
    await expect(combo).toBeVisible();
    await expect(combo).toHaveRole('combobox');
    await expect(combo).toHaveAccessibleName('Port of entry');
    await expect(select).toBeAttached();
    await expect(select).toBeHidden();

    // Unselected state: the visible input carries the placeholder text while
    // the hidden select — the data truth — stays empty.
    await expect(combo).toHaveValue('Select port of entry');
    await expect(select).toHaveValue('');

    // Name search: option text is 'Name (CODE)', so typing part of a port
    // name filters the list case-insensitively; non-matches drop out.
    await combo.fill('aberdeen');
    await expect(pages.page.getByRole('option', { name: 'Aberdeen Harbour (GB ABD)' })).toBeVisible();
    await expect(pages.page.getByRole('option', { name: 'Aberdeen Airport (GB DYC)' })).toBeVisible();
    await expect(pages.page.getByRole('option', { name: 'Port of Dover (GB DVR)' })).toHaveCount(0);

    // The select's placeholder and divider rows never surface as suggestions.
    await combo.fill('');
    await combo.press('ArrowDown');
    await expect(pages.page.getByRole('option', { name: 'Aberdeen Airport (GB DYC)' })).toBeVisible();
    await expect(pages.page.getByRole('option', { name: 'Select port of entry' })).toHaveCount(0);
    await expect(pages.page.getByRole('option', { name: '──────────' })).toHaveCount(0);

    // Code search: typing the CODE surfaces the same suggestion — the code
    // lives in the option text — and picking it syncs the hidden select to
    // the code the journey stores.
    await combo.fill(PORT_CODE);
    await pages.page.getByRole('option', { name: PORT_OPTION, exact: true }).click();
    await expect(combo).toHaveValue(PORT_OPTION);
    await expect(select).toHaveValue(PORT_CODE);

    // The save round-trips the code. The means stays blank (submit-enforced),
    // so the save skips the conditional transit page and walks on to the
    // transporter-type page.
    await pages.arrivalDetails.fillArrivalDate(ARRIVAL_DATE);
    await pages.arrivalDetails.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'What type of transporter will move the animals?' })).toBeVisible();

    // Re-entry shows the option text on the input and the stored code on the select.
    await pages.arrivalDetails.open(journeyId);
    await expect(combo).toHaveValue(PORT_OPTION);
    await expect(select).toHaveValue(PORT_CODE);
  });
});
