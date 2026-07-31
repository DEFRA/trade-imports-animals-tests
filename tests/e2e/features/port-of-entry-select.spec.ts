import { test, expect } from '@fixtures';

const PORT_OPTION = 'Aberdeen Harbour (GB ABD)';
const PORT_CODE = 'GB ABD';

test.describe('Port of entry plain select', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('renders name-and-code options, submits the code and persists it', async ({ journey, pages }) => {
    await journey.toArrivalDetails();
    const journeyId = pages.arrivalDetails.journeyIdFromUrl();

    const select = pages.arrivalDetails.portOfEntry;
    await expect(select).toBeVisible();
    await expect(select).toHaveRole('combobox');
    await expect(select).toHaveAccessibleName('Port of entry');
    await expect(select.locator('option').first()).toHaveText('Select port of entry');
    await expect(select.locator('option')).toHaveCount(80);

    await pages.arrivalDetails.selectPort(PORT_OPTION);
    await expect(select).toHaveValue(PORT_CODE);
    await pages.arrivalDetails.fillArrivalDate('12/12/2026');
    await pages.arrivalDetails.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'What type of transporter will move the animals?' })).toBeVisible();

    await pages.arrivalDetails.open(journeyId);
    await expect(select).toHaveValue(PORT_CODE);
  });
});
