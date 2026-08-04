import type { APIResponse, Locator, Page } from '@playwright/test';
import type { PlantProductsNotificationResponse } from '@domain/plant-products/models/api/notification';
import { test, expect } from '@fixtures';

// From the frontend's plant-products flow/fixtures/happy-path.json.
const differentSourceInternalReference = 'IMPORT-041';

type CopyForm = {
  action: string;
  crumb: string;
  idempotencyKey: string;
  copyOrigin: string;
};

const readCopyForm = async (form: Locator): Promise<CopyForm> => {
  const action = await form.getAttribute('action');
  if (!action) throw new Error('Copy form has no action');
  return {
    action,
    crumb: await form.locator('input[name="crumb"]').inputValue(),
    idempotencyKey: await form.locator('input[name="idempotencyKey"]').inputValue(),
    copyOrigin: await form.locator('input[name="copyOrigin"]').inputValue(),
  };
};

const postCopyForm = async (page: Page, form: CopyForm, idempotencyKey = form.idempotencyKey): Promise<APIResponse> =>
  page.request.post(form.action, {
    form: {
      crumb: form.crumb,
      idempotencyKey,
      copyOrigin: form.copyOrigin,
    },
    maxRedirects: 0,
  });

const copyLocation = (response: APIResponse): string => {
  expect(response.status()).toBe(302);
  const location = response.headers().location;
  expect(location).toMatch(/^\/plant-products\/notifications\/GBN-PP-[^/]+$/);
  return location;
};

const referenceFromLocation = (location: string): string => location.split('/').at(-1) ?? '';

const copiedContent = ({
  accompanyingDocuments: _documents,
  declaration: _declaration,
  status: _status,
  referenceNumber: _referenceNumber,
  id: _id,
  created: _created,
  updated: _updated,
  ...content
}: PlantProductsNotificationResponse) => {
  void [_documents, _declaration, _status, _referenceNumber, _id, _created, _updated];
  return content;
};

test.describe('Plant-products copy as new', { tag: '@integration' }, () => {
  test('read-only Copy creates a new documentless draft with carried content under the plant prefix', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
    plantProductsNotificationActions: actions,
  }) => {
    const draft = await apiJourney.createNotificationWithDocuments(1);
    const submitted = await plantProductsApi.setStatus(draft.referenceNumber, { status: 'SUBMITTED' });
    const source = await plantProductsApi.load(submitted.referenceNumber);

    await pages.notificationView.open(source.referenceNumber);
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.copyForm).toHaveAttribute('action', `/plant-products/notifications/${source.referenceNumber}/copy`);
    await expect(pages.notificationView.idempotencyKey).toHaveAttribute('value', /.+/);
    await expect(pages.notificationView.copyOrigin).toHaveValue('notification-view');
    await actions.copyFromView();

    await expect(pages.page).toHaveURL((url) => /^\/plant-products\/notifications\/GBN-PP-[^/]+$/.test(url.pathname));
    await expect(pages.hub.heading).toBeVisible();
    await expect(pages.page.getByText('Draft', { exact: true })).toBeVisible();
    const copiedReference = pages.hub.journeyIdFromUrl();
    expect(copiedReference).toMatch(/^GBN-PP-/);
    expect(copiedReference).not.toBe(source.referenceNumber);

    const copied = await plantProductsApi.load(copiedReference);
    expect(copied.status).toBe('DRAFT');
    expect(copied.declaration).toBeNull();
    expect(copiedContent(copied)).toEqual(copiedContent(source));
    expect((await plantProductsApi.listDocuments(copiedReference)).documents).toEqual([]);
  });

  test('the same rendered dashboard form creates one draft and a re-rendered form creates another', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const source = await apiJourney.createSubmittedNotification();
    const reference = source.referenceNumber;
    await pages.notificationView.open(reference);
    await pages.plantNotificationDashboard.open(false);
    await pages.plantNotificationDashboard.searchForReference(reference);
    const firstFormLocator = pages.plantNotificationDashboard.actionForm(pages.plantNotificationDashboard.copy(reference));
    await expect(firstFormLocator).toHaveAttribute('action', new RegExp(`^/plant-products/notifications/${reference}/copy(?:\\?.*)?$`));
    await expect(pages.plantNotificationDashboard.copyOrigin(reference)).toHaveValue('dashboard');
    const firstForm = await readCopyForm(firstFormLocator);

    const firstResponse = await postCopyForm(pages.page, firstForm);
    const repeatedResponse = await postCopyForm(pages.page, firstForm);
    const firstLocation = copyLocation(firstResponse);
    expect(copyLocation(repeatedResponse)).toBe(firstLocation);
    const firstCopyReference = referenceFromLocation(firstLocation);
    expect(await plantProductsApi.load(firstCopyReference)).toMatchObject({
      referenceNumber: firstCopyReference,
      status: 'DRAFT',
    });

    await pages.page.reload();
    const reRenderedFormLocator = pages.plantNotificationDashboard.actionForm(pages.plantNotificationDashboard.copy(reference));
    const reRenderedForm = await readCopyForm(reRenderedFormLocator);
    expect(reRenderedForm.idempotencyKey).not.toBe(firstForm.idempotencyKey);
    const secondLocation = copyLocation(await postCopyForm(pages.page, reRenderedForm));
    expect(secondLocation).not.toBe(firstLocation);
    const secondCopyReference = referenceFromLocation(secondLocation);
    expect(await plantProductsApi.load(secondCopyReference)).toMatchObject({
      referenceNumber: secondCopyReference,
      status: 'DRAFT',
    });
  });

  test('the current global key returns the first source copy when reused against a different source', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const firstSource = await apiJourney.createSubmittedNotification();
    const firstSourceInternalReference = firstSource.origin?.internalReference;
    if (!firstSourceInternalReference) throw new Error('First submitted notification has no internal reference');
    const secondDraft = await apiJourney.createFullNotification();
    await plantProductsApi.replace(secondDraft.referenceNumber, {
      ...secondDraft,
      origin: { ...secondDraft.origin, internalReference: differentSourceInternalReference },
    });
    const secondSource = await plantProductsApi.setStatus(secondDraft.referenceNumber, { status: 'SUBMITTED' });

    await pages.notificationView.open(firstSource.referenceNumber);
    await pages.plantNotificationDashboard.open(false);
    await pages.plantNotificationDashboard.searchForReference(firstSource.referenceNumber);
    const firstForm = await readCopyForm(
      pages.plantNotificationDashboard.actionForm(pages.plantNotificationDashboard.copy(firstSource.referenceNumber)),
    );
    const firstLocation = copyLocation(await postCopyForm(pages.page, firstForm));

    await pages.notificationView.open(secondSource.referenceNumber, false);
    await pages.plantNotificationDashboard.open(false);
    await pages.plantNotificationDashboard.searchForReference(secondSource.referenceNumber);
    const secondForm = await readCopyForm(
      pages.plantNotificationDashboard.actionForm(pages.plantNotificationDashboard.copy(secondSource.referenceNumber)),
    );
    const secondLocation = copyLocation(await postCopyForm(pages.page, secondForm, firstForm.idempotencyKey));

    // pp-098 will scope idempotency to the source; until it lands the key is global and returns the first source's copy.
    expect(secondLocation).toBe(firstLocation);
    const reusedCopy = await plantProductsApi.load(referenceFromLocation(secondLocation));
    expect(reusedCopy.origin?.internalReference).toBe(firstSourceInternalReference);
    expect(reusedCopy.origin?.internalReference).not.toBe(differentSourceInternalReference);
  });
});
