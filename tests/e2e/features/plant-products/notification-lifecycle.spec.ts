import { test, expect } from '@fixtures';

// From the frontend's plant-products flow/fixtures/happy-path.json.
const amendedInternalReference = 'IMPORT-041';

const plantNotificationUrl = (reference: string, slug = '', query = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}${query}$`);

test.describe('Plant-products notification lifecycle', { tag: '@integration' }, () => {
  test('an API-seeded draft resumes and saves onto the same notification', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const reference = created.referenceNumber;

    await pages.hub.open(reference);
    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference).test(url.pathname));
    await expect(pages.hub.heading).toBeVisible();
    await expect(pages.page.getByText(reference, { exact: true })).toBeVisible();
    await expect(pages.page.getByText('Draft', { exact: true })).toBeVisible();
    await expect(pages.hub.rowStatus('Origin of the import')).toHaveText('Completed');
    expect((await plantProductsApi.load(reference)).status).toBe('DRAFT');

    await pages.hub.task('Origin of the import').click();
    await pages.countryOfOrigin.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference, 'origin-of-import').test(url.pathname));
    await pages.originOfImport.internalReference.fill(amendedInternalReference);
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference).test(url.pathname));
    await expect(pages.hub.rowStatus('Origin of the import')).toHaveText('Completed');
    expect((await plantProductsApi.load(reference)).origin?.internalReference).toBe(amendedInternalReference);
  });

  test('a complete API-seeded draft submits and renders its confirmation', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createNotificationWithDocuments(1);
    const reference = created.referenceNumber;
    const seeded = await plantProductsApi.load(reference);
    await plantProductsApi.replace(reference, { ...seeded, declaration: null });

    await pages.reviewNotification.open(reference);
    await expect(pages.reviewNotification.heading).toBeVisible();
    await expect(pages.page.getByText('Draft', { exact: true })).toBeVisible();
    expect((await plantProductsApi.load(reference)).status).toBe('DRAFT');
    await pages.reviewNotification.continueButton.click();

    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference, 'declaration').test(url.pathname));
    await pages.declaration.declaration.check();
    await pages.declaration.submitNotification.click();

    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference, 'confirmation').test(url.pathname));
    await expect(pages.confirmation.heading).toBeVisible();
    await expect(pages.confirmation.referenceNumber).toHaveText(reference);
    const submitted = await plantProductsApi.load(reference);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.declaration).toMatchObject({ agreed: true, declaredAt: expect.any(String) });
  });

  test('a submitted notification enters amend and persists working edits', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const created = await apiJourney.createSubmittedNotification();
    const reference = created.referenceNumber;

    await actions.amend(reference);

    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference).test(url.pathname));
    await expect(pages.page.getByText('Amending', { exact: true })).toBeVisible();
    expect((await plantProductsApi.load(reference)).status).toBe('AMEND');

    await pages.hub.task('Origin of the import').click();
    await pages.countryOfOrigin.saveAndContinue.click();
    await pages.originOfImport.internalReference.fill(amendedInternalReference);
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => /^\/plant-products\//.test(url.pathname));

    await pages.notificationView.open(reference, false);
    await expect(pages.notificationView.value('About the consignment', 'Internal reference')).toHaveText(amendedInternalReference);
    const amended = await plantProductsApi.load(reference);
    expect(amended.status).toBe('AMEND');
    expect(amended.origin?.internalReference).toBe(amendedInternalReference);
  });

  test('cancel amendment restores the submitted answer rather than only flipping status', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const submitted = await apiJourney.createSubmittedNotification();
    const reference = submitted.referenceNumber;
    const submittedInternalReference = submitted.origin?.internalReference;
    if (!submittedInternalReference) throw new Error('Submitted notification has no internal reference');
    await plantProductsApi.setStatus(reference, { status: 'AMEND' });
    const amending = await plantProductsApi.load(reference);
    await plantProductsApi.replace(reference, {
      ...amending,
      origin: { ...amending.origin, internalReference: amendedInternalReference },
    });

    await actions.cancelAmend(reference);
    await expect(pages.cancelAmend.heading).toBeVisible();
    await actions.confirmCancelAmend();

    await expect(pages.page).toHaveURL((url) =>
      plantNotificationUrl(reference, 'review-notification', '\\?cancelled=1').test(`${url.pathname}${url.search}`),
    );
    await expect(pages.page.getByRole('alert')).toContainText('The amendment has been cancelled and the submitted version restored.');
    await expect(pages.notificationView.value('About the consignment', 'Internal reference')).toHaveText(submittedInternalReference);
    const restored = await plantProductsApi.load(reference);
    expect(restored.status).toBe('SUBMITTED');
    expect(restored.origin?.internalReference).toBe(submittedInternalReference);
  });

  test('view renders a submitted notification read-only', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const submitted = await apiJourney.createSubmittedNotification();
    const reference = submitted.referenceNumber;
    const submittedInternalReference = submitted.origin?.internalReference;
    if (!submittedInternalReference) throw new Error('Submitted notification has no internal reference');

    await actions.view(reference);

    await expect(pages.page).toHaveURL((url) => plantNotificationUrl(reference, 'review-notification').test(url.pathname));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.value('About the consignment', 'Internal reference')).toHaveText(submittedInternalReference);
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    await expect(pages.notificationView.continueButton).toHaveCount(0);
    await expect(pages.notificationView.copy).toBeVisible();
    await expect(pages.notificationView.delete).toBeVisible();
    expect((await plantProductsApi.load(reference)).status).toBe('SUBMITTED');
  });
});
