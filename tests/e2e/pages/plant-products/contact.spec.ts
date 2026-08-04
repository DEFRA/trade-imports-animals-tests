import { test, expect } from '@fixtures';

const plantUrl = (reference: string) => new RegExp(`^/plant-products/notifications/${reference}(?:\\?.*)?$`);

test.describe('Plant-products contact details page', { tag: '@integration' }, () => {
  test('is not pre-filled, enforces name plus one contact method, saves by hand and resumes from Mongo', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, responsiblePerson: null });
    await pages.contactDetails.open(created.referenceNumber);

    await expect(pages.contactDetails.heading).toBeVisible();
    await expect(pages.contactDetails.responsiblePersonName).toHaveValue('');
    await expect(pages.contactDetails.responsiblePersonEmail).toHaveValue('');
    await expect(pages.contactDetails.responsiblePersonTelephone).toHaveValue('');
    await pages.contactDetails.saveAndContinue.click();
    expect(
      await pages.contactDetails.errorSummary.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual(['#responsiblePersonName', '#responsiblePersonEmail']);

    await pages.contactDetails.responsiblePersonName.fill('Responsible Person');
    await pages.contactDetails.responsiblePersonEmail.fill('responsible.person@example.com');
    await pages.contactDetails.responsiblePersonTelephone.fill('+44 7700 900124');
    await pages.contactDetails.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
    await expect(pages.hub.rowStatus('Contact details')).toHaveText('Completed');
    expect((await plantProductsApi.load(created.referenceNumber)).responsiblePerson).toMatchObject({
      name: 'Responsible Person',
      email: 'responsible.person@example.com',
      telephone: '+44 7700 900124',
    });

    await pages.contactDetails.open(created.referenceNumber, false);
    await expect(pages.contactDetails.responsiblePersonName).toHaveValue('Responsible Person');
    await expect(pages.contactDetails.responsiblePersonEmail).toHaveValue('responsible.person@example.com');
    await pages.contactDetails.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
