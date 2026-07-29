import { test, expect } from '@fixtures';

test.describe('Transited countries page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('shows an error summary when submitted empty', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();
    await pages.overview.task('Arrival details').click();
    await pages.arrivalDetails.fillArrivalDate({ day: '12', month: '12', year: '2026' });
    await pages.arrivalDetails.portOfEntry.fill('Aberdeen');
    await pages.page.getByRole('option', { name: 'Aberdeen Harbour (GB ABD)', exact: true }).click();
    await pages.page.getByRole('radio', { name: 'Road Vehicle', exact: true }).check();
    await pages.arrivalDetails.transportIdentification.fill('FR-892-LK');
    await pages.arrivalDetails.transportDocumentReference.fill('CMR-2026-884721');
    await pages.arrivalDetails.saveAndContinue.click();
    await pages.transitedCountries.heading.waitFor();

    await pages.transitedCountries.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
