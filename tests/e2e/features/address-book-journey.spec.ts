import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';

/**
 * M3 / epic milestone walk-through for EUDPA-58, demonstrated end to end
 * against the full workspace stack (frontend + animals-backend + the real
 * trade-imports-operators service). This is the first journey where a
 * notification carries operatorIds, so it activates the M1.5 submit guard.
 *
 * Tagged @compose so it runs against the docker-compose stack (which carries
 * the 30-operator seed and the operators service) and is excluded from the CDP
 * `npm run test` run, where operators is not deployed (design open item 4).
 *
 * Approach: the bulk of each notification is API-seeded (a complete DRAFT with
 * the parties written as plain snapshots — no operatorIds), then the party we
 * care about is (re-)selected through the real, swapped select page so it gains
 * an operatorId; the addresses hub Save persists that selection to the backend.
 * The other parties stay as plain snapshots, so the guard only fires on the
 * operatorId-bearing party — exactly the mixed state the guard must handle.
 *
 * Data owner: seed crn 2100010101 (seeds/mongodb/30-operators-seed.js), the
 * defra-id-stub's default single-organisation customer, so both the API seed
 * and the signed-in UI session speak for the same crn.
 */
const SEED_CRN = '2100010101';
const SEED_CONSIGNOR_ID_PREFIX = '6a5702e4cafe2026';

/** The seed builds _id = 6a5702e4cafe2026 + the zero-padded 1..30 index. */
function seedOperatorId(index: number): string {
  return `${SEED_CONSIGNOR_ID_PREFIX}${String(index).padStart(8, '0')}`;
}

// Seed index 1 is a CONSIGNOR (index % 7 === 1) with a non-empty county — the
// c-020 fields (county, telephone, email) are all populated for it.
const SEED_CONSIGNOR = {
  index: 1,
  name: 'Lowland Cattle Co 1',
  county: 'Perthshire',
  telephone: '+44 1463 200001',
  email: 'ops1@seed.example.com',
};

// Seed index 8 is another CONSIGNOR — used as the replacement after a delete.
const SEED_CONSIGNOR_REPLACEMENT_NAME = 'Glen Valley Farms 8';

// Seed index 9 is a CONSIGNEE, and its name is not a substring of any CONSIGNOR
// label, so it must be absent from the consignor select page (type scoping).
const SEED_CONSIGNEE_NAME = 'Coastal Poultry Ltd 9';

/** Fields for a freshly-created operator that a mutation leg owns outright. */
const FRESH_FORM = {
  addressLine1: '1 Test Street',
  city: 'Testville',
  county: 'Testshire',
  postcode: 'TE1 1ST',
  country: 'Ireland',
  telephone: '01234 567890',
  email: 'ops@example.com',
};

async function signInAsSeedOwner(pages: PageObjects): Promise<void> {
  await pages.addressBook.open(false);
  await pages.signIn.signIn({ userId: SEED_CRN });
  await pages.addressBook.heading.waitFor();
}

/** Create a CONSIGNOR operator through the UI; the caller owns its name. */
async function createConsignor(pages: PageObjects, name: string): Promise<void> {
  await pages.addressBook.open();
  await pages.addressBook.btnAddNewOperator.click();
  await pages.addOperatorType.radioByValue('CONSIGNOR').check();
  await pages.addOperatorType.btnContinue.click();
  await pages.operatorForm.headingAddDetails.waitFor();
  await pages.operatorForm.fill({ name, ...FRESH_FORM });
  await pages.operatorForm.btnSaveChanges.click();
  await pages.addressBook.heading.waitFor();
}

async function deleteOperator(pages: PageObjects, name: string): Promise<void> {
  await pages.addressBook.openWithParams({ q: name });
  await pages.addressBook.viewLink(name).click();
  await pages.viewOperator.btnDelete.click();
  await pages.deleteOperator.heading.waitFor();
  await pages.deleteOperator.btnDelete.click();
  await pages.addressBook.heading.waitFor();
}

async function editOperatorCity(pages: PageObjects, name: string, newCity: string): Promise<void> {
  await pages.addressBook.openWithParams({ q: name });
  await pages.addressBook.viewLink(name).click();
  await pages.viewOperator.btnEdit.click();
  await pages.operatorForm.headingEditDetails.waitFor();
  await pages.operatorForm.inputCity.fill(newCity);
  await pages.operatorForm.btnSaveChanges.click();
  await pages.addressBook.heading.waitFor();
}

/**
 * On the consignor select page (already open), pick a consignor by name and
 * persist the selection to the backend via the addresses hub Save. Landing on
 * the entry-point page confirms the hub Save succeeded.
 */
async function selectConsignorAndPersist(pages: PageObjects, consignorName: string): Promise<void> {
  await pages.consignorSelection.radioConsignorOrExporter(consignorName).click();
  await pages.consignorSelection.btnSaveAndContinue.click();
  await pages.addresses.heading.waitFor();
  await pages.addresses.btnSaveAndContinue.click();
  await pages.entryPoint.heading.waitFor();
}

/** Re-open a persisted notification and re-select its consignor. */
async function reselectConsignor(pages: PageObjects, referenceNumber: string, consignorName: string): Promise<void> {
  await pages.notificationView.open(referenceNumber);
  await pages.notificationView.navigateToFrontend('/consignors/select');
  await pages.consignorSelection.heading.waitFor();
  await selectConsignorAndPersist(pages, consignorName);
}

test.describe('Address book journey', { tag: ['@compose', '@demo'] }, () => {
  test.beforeEach(async ({ pages }) => {
    await signInAsSeedOwner(pages);
  });

  test("an operator shows only on its own type's select page, keyed by id, and its county/telephone/email reach the review page (EUDPA-294.AC1, c-005, c-020)", async ({
    pages,
    apiJourney,
  }) => {
    const created = await apiJourney.createFullNotification();
    const ref = created.referenceNumber;

    await apiJourney.resumeInUi(ref, pages.consignorSelection);

    // Type scoping: a consignor is offered, a consignee never is (b-009).
    await expect(pages.consignorSelection.radioConsignorOrExporter(SEED_CONSIGNOR.name)).toBeVisible();
    await expect(pages.consignorSelection.radioConsignorOrExporter(SEED_CONSIGNEE_NAME)).toHaveCount(0);

    // c-005: the radio value is the operator id, not an array index or the name.
    await expect(pages.consignorSelection.radioConsignorOrExporter(SEED_CONSIGNOR.name)).toHaveValue(seedOperatorId(SEED_CONSIGNOR.index));

    await selectConsignorAndPersist(pages, SEED_CONSIGNOR.name);

    // c-020: the review page renders the fields the address book made mandatory.
    await pages.notificationView.open(ref);
    const consignor = pages.notificationView.summaryValue('Consignor');
    await expect(consignor).toContainText(SEED_CONSIGNOR.name);
    await expect(consignor).toContainText(SEED_CONSIGNOR.county);
    await expect(consignor).toContainText(SEED_CONSIGNOR.telephone);
    await expect(consignor).toContainText(SEED_CONSIGNOR.email);

    // The guard passes for an existing operator, so the submit completes.
    await pages.notificationView.btnConfirmAndSubmit.click();
    await pages.declaration.heading.waitFor();
    await pages.declaration.checkboxDeclaration.click();
    await pages.declaration.btnSubmitNotification.click();
    await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
  });

  test('deleting a selected operator blocks submission on the review page until it is replaced (EUDPA-293.AC2)', async ({
    pages,
    apiJourney,
  }) => {
    const consignorName = `E2E Journey Delete ${Date.now()}`;
    await createConsignor(pages, consignorName);

    const created = await apiJourney.createFullNotification();
    const ref = created.referenceNumber;
    await apiJourney.resumeInUi(ref, pages.consignorSelection);
    await selectConsignorAndPersist(pages, consignorName);

    await deleteOperator(pages, consignorName);

    // The review page flags the deleted operator and withdraws the submit path.
    await pages.notificationView.open(ref);
    await expect(pages.notificationView.errorSummary).toBeVisible();
    await expect(pages.notificationView.errorSummary).toContainText(/replace/i);
    await expect(pages.notificationView.errorSummary).not.toContainText(/could not be verified/i);
    await expect(pages.notificationView.btnConfirmAndSubmit).toHaveCount(0);

    // Replacing the party with a live operator clears the block and submits.
    await reselectConsignor(pages, ref, SEED_CONSIGNOR_REPLACEMENT_NAME);
    await pages.notificationView.open(ref);
    await expect(pages.notificationView.errorSummary).toHaveCount(0);
    await expect(pages.notificationView.btnConfirmAndSubmit).toBeVisible();

    await pages.notificationView.btnConfirmAndSubmit.click();
    await pages.declaration.heading.waitFor();
    await pages.declaration.checkboxDeclaration.click();
    await pages.declaration.btnSubmitNotification.click();
    await expect(pages.page).toHaveURL(pages.declaration.expectedUrl);
  });

  test('an operator edited after selection still shows its old values on review — the accepted staleness (c-017)', async ({
    pages,
    apiJourney,
  }) => {
    const consignorName = `E2E Journey Stale ${Date.now()}`;
    await createConsignor(pages, consignorName);

    const created = await apiJourney.createFullNotification();
    const ref = created.referenceNumber;
    await apiJourney.resumeInUi(ref, pages.consignorSelection);
    await selectConsignorAndPersist(pages, consignorName);

    await pages.notificationView.open(ref);
    await expect(pages.notificationView.summaryValue('Consignor')).toContainText(FRESH_FORM.city);

    // Edit the operator in the address book after it has been selected.
    await editOperatorCity(pages, consignorName, 'Newtown');

    // c-017: the notification keeps the copy taken at selection time — no re-sync.
    await pages.notificationView.open(ref);
    await expect(pages.notificationView.summaryValue('Consignor')).toContainText(FRESH_FORM.city);
    await expect(pages.notificationView.summaryValue('Consignor')).not.toContainText('Newtown');
  });

  test('an amend notification blocks on a deleted operator exactly as a draft does (c-013)', async ({ pages, apiJourney }) => {
    const consignorName = `E2E Journey Amend ${Date.now()}`;
    await createConsignor(pages, consignorName);

    const amended = await apiJourney.createAmendNotification();
    const ref = amended.referenceNumber;
    await apiJourney.resumeInUi(ref, pages.consignorSelection);
    await selectConsignorAndPersist(pages, consignorName);

    await deleteOperator(pages, consignorName);

    await pages.notificationView.open(ref);
    await expect(pages.notificationView.errorSummary).toBeVisible();
    await expect(pages.notificationView.errorSummary).toContainText(/replace/i);
    await expect(pages.notificationView.btnConfirmAndSubmit).toHaveCount(0);
  });
});
