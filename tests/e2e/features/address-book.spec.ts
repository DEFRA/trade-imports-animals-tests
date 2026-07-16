import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';

/**
 * M2 milestone walk-through for the EUDPA-58 address book, demonstrated end to
 * end against the real trade-imports-operators (M1) service via the workspace
 * stack. RED-FIRST (inc-023): every leg fails until the M2 pages are all
 * reachable and correct.
 *
 * Tagged @compose so it runs against the docker-compose stack (which carries the
 * 30-operator seed and the operators service) and is excluded from the CDP
 * `npm run test` run, where the operators service is not deployed
 * (design open item 4).
 *
 * Data owner: seed crn 2100010101 (seeds/mongodb/30-operators-seed.js) — the
 * defra-id-stub's default single-organisation customer (page-objects/auth/sign-in-page.ts
 * default userId), so signing in as the seed owner needs no stub/AUTH_OVERRIDE change.
 * The operators list is scoped by the signed-in user's Trade-Imports-Crn header.
 */
const SEED_CRN = '2100010101';
const PAGE_SIZE = 25;
const SEED_TOTAL = 30;

// Operators derived from the seed's deterministic build (index 1..30).
const LIST_OPERATOR = {
  name: 'Coastal Poultry Ltd 4', // index 4
  type: 'Place of destination',
  country: 'United Kingdom',
  address: "4 Drover's Way, Unit 4, Dumfries, DG1 2RW", // county empty for this index
};

const TRANSPORTER_OPERATOR = {
  name: 'Highland Livestock Ltd 5', // index 5 — unique name substring
  type: 'Transporter',
  country: 'Ireland',
  address: "5 Drover's Way, Unit 5, Inverness, Highland, IV2 3JH",
  approvalNumber: 'APR-0005',
  transporterCategory: 'Private',
};

const SEED_TRANSPORTER_COUNT = 4; // indexes 5, 12, 19, 26
const SEED_BRANCH_ADDRESS_COUNT = 4; // indexes 6, 13, 20, 27

const TYPE_RADIO_LABELS = [
  'Place of origin',
  'Consignor',
  'Consignee',
  'Importer',
  'Place of destination',
  'Transporter',
  'Branch address',
];

const VALID_FORM = {
  addressLine1: '1 Test Street',
  city: 'Testville',
  postcode: 'TE1 1ST',
  country: 'Ireland', // must be an option the reference-data dropdown actually offers (UK is not in the MDM list)
  telephone: '01234567890',
  email: 'ops@example.com',
};

async function signInAsSeedOwner(pages: PageObjects): Promise<void> {
  await pages.addressBook.open(false);
  await pages.signIn.signIn({ userId: SEED_CRN });
  await pages.addressBook.heading.waitFor();
}

/** Add one operator through the UI and return to the list. Returns the name used. */
async function addOperator(pages: PageObjects, name: string, type: string = 'CONSIGNOR'): Promise<string> {
  await pages.addressBook.btnAddNewOperator.click();
  await pages.addOperatorType.radioByValue(type).check();
  await pages.addOperatorType.btnContinue.click();
  await pages.operatorForm.headingAddDetails.waitFor();
  await pages.operatorForm.fill({ name, ...VALID_FORM });
  await pages.operatorForm.btnSaveChanges.click();
  await pages.addressBook.heading.waitFor();
  return name;
}

test.describe('Address book', { tag: '@compose' }, () => {
  test.beforeEach(async ({ pages }) => {
    await signInAsSeedOwner(pages);
  });

  test.describe('Navigation', () => {
    test('exposes Dashboard and Address book links and moves between them', async ({ pages }) => {
      await expect(pages.addressBook.navDashboard).toBeVisible();
      await expect(pages.addressBook.navAddressBook).toBeVisible();

      await pages.addressBook.navDashboard.click();
      await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
      await expect(pages.notificationDashboard.heading).toBeVisible();

      await pages.addressBook.navAddressBook.click();
      await expect(pages.page).toHaveURL(pages.addressBook.expectedUrl);
      await expect(pages.addressBook.heading).toBeVisible();
    });
  });

  test.describe('List', () => {
    test('shows the entity-scoped intro and primary button (c-016)', async ({ pages }) => {
      await expect(pages.addressBook.intro).toBeVisible();
      await expect(pages.addressBook.intro).toHaveText('Manage your operators for use across import notifications.');
      await expect(pages.addressBook.btnAddNewOperator).toBeVisible();
    });

    test('renders the Name, Type, Address and Country columns', async ({ pages }) => {
      await expect(pages.addressBook.table.getByRole('columnheader', { name: 'Name' })).toBeVisible();
      await expect(pages.addressBook.table.getByRole('columnheader', { name: 'Type' })).toBeVisible();
      await expect(pages.addressBook.table.getByRole('columnheader', { name: 'Address' })).toBeVisible();
      await expect(pages.addressBook.table.getByRole('columnheader', { name: 'Country' })).toBeVisible();
    });

    test('renders a seeded operator row with name, type, address and country', async ({ pages }) => {
      await pages.addressBook.openWithParams({ q: LIST_OPERATOR.name });

      const row = pages.addressBook.row(LIST_OPERATOR.name);
      await expect(row).toHaveCount(1);
      await expect(row.getByRole('cell').nth(0)).toHaveText(LIST_OPERATOR.name);
      await expect(row.getByRole('cell').nth(1)).toHaveText(LIST_OPERATOR.type);
      await expect(row.getByRole('cell').nth(2)).toHaveText(LIST_OPERATOR.address);
      await expect(row.getByRole('cell').nth(3)).toHaveText(LIST_OPERATOR.country);
    });
  });

  test.describe('Search and filter (server-side, URL params — c-012)', () => {
    test('search by name returns the single matching operator and retains the term', async ({ pages }) => {
      await pages.addressBook.openWithParams({ q: TRANSPORTER_OPERATOR.name });

      await expect(pages.addressBook.inputSearch).toHaveValue(TRANSPORTER_OPERATOR.name);
      await expect(pages.addressBook.rows).toHaveCount(1);
      await expect(pages.addressBook.row(TRANSPORTER_OPERATOR.name)).toBeVisible();
    });

    test('a search with no matches shows the empty message', async ({ pages }) => {
      await pages.addressBook.openWithParams({ q: 'no-such-operator-zzz' });

      await expect(pages.addressBook.emptyMessage).toBeVisible();
      await expect(pages.addressBook.rows).toHaveCount(0);
    });

    test('filtering by operator type returns only that type', async ({ pages }) => {
      await pages.addressBook.openWithParams({ operatorType: 'TRANSPORTER' });

      await expect(pages.addressBook.rows).toHaveCount(SEED_TRANSPORTER_COUNT);
      const count = await pages.addressBook.rows.count();
      for (let i = 0; i < count; i += 1) {
        await expect(pages.addressBook.rows.nth(i).getByRole('cell').nth(1)).toHaveText('Transporter');
      }
    });

    test('the branch address filter returns only branch addresses', async ({ pages }) => {
      await pages.addressBook.openWithParams({ operatorType: 'BRANCH_ADDRESS' });

      await expect(pages.addressBook.rows).toHaveCount(SEED_BRANCH_ADDRESS_COUNT);
      const count = await pages.addressBook.rows.count();
      for (let i = 0; i < count; i += 1) {
        await expect(pages.addressBook.rows.nth(i).getByRole('cell').nth(1)).toHaveText('Branch address');
      }
    });
  });

  test.describe('Pagination past 25 (30-operator seed)', () => {
    test('shows 25 on page one and the remainder on page two', async ({ pages }) => {
      await pages.addressBook.openWithParams({});

      await expect(pages.addressBook.rows).toHaveCount(PAGE_SIZE);
      const pageOne = await pages.addressBook.parseResultsLabel();
      expect(pageOne.start).toBe(1);
      expect(pageOne.end).toBe(PAGE_SIZE);
      expect(pageOne.total).toBeGreaterThanOrEqual(SEED_TOTAL);
      await expect(pages.addressBook.linkNextPage).toBeVisible();
      await expect(pages.addressBook.linkPreviousPage).toHaveCount(0);

      await pages.addressBook.linkNextPage.click();

      await expect(pages.page).toHaveURL(/[?&]page=2/);
      await expect(pages.addressBook.linkPreviousPage).toBeVisible();
      const pageTwo = await pages.addressBook.parseResultsLabel();
      expect(pageTwo.start).toBe(PAGE_SIZE + 1);
      expect(pageTwo.total).toBe(pageOne.total);
      await expect(pages.addressBook.rows).toHaveCount(pageTwo.total - PAGE_SIZE);
    });
  });

  test.describe('Add — type selection', () => {
    test('opens the type page from the primary button with the add-flow heading', async ({ pages }) => {
      await pages.addressBook.btnAddNewOperator.click();

      await expect(pages.page).toHaveURL(pages.addOperatorType.expectedUrl);
      await expect(pages.addOperatorType.heading).toBeVisible();
    });

    test('renders all seven type radios with the "or" divider before Branch address', async ({ pages }) => {
      await pages.addressBook.btnAddNewOperator.click();

      await expect(pages.addOperatorType.radioItems).toHaveCount(TYPE_RADIO_LABELS.length);
      for (let i = 0; i < TYPE_RADIO_LABELS.length; i += 1) {
        await expect(pages.addOperatorType.radioItems.nth(i)).toContainText(TYPE_RADIO_LABELS[i]);
      }

      // Full rendered list including the divider (7 items + 1 divider), in order.
      const nodes = pages.addOperatorType.radioAndDividerNodes;
      await expect(nodes).toHaveCount(TYPE_RADIO_LABELS.length + 1);
      await expect(pages.addOperatorType.divider).toHaveText('or');
      await expect(nodes.nth(6)).toHaveClass(/govuk-radios__divider/);
      await expect(nodes.nth(6)).toHaveText('or');
      await expect(nodes.nth(7)).toContainText('Branch address');
    });

    test('shows an error when continuing without a type', async ({ pages }) => {
      await pages.addressBook.btnAddNewOperator.click();
      await pages.addOperatorType.btnContinue.click();

      await expect(pages.page).toHaveURL(pages.addOperatorType.expectedUrl);
      await expect(pages.addOperatorType.errorSummary).toBeVisible();
      await expect(pages.addOperatorType.errorSummaryLink('Select an operator type')).toBeVisible();
    });
  });

  test.describe('Add — details and conditional fields (c-019)', () => {
    test('choosing Transporter shows the approval number and transporter category fields', async ({ pages }) => {
      await pages.addressBook.btnAddNewOperator.click();
      await pages.addOperatorType.radioByValue('TRANSPORTER').check();
      await pages.addOperatorType.btnContinue.click();

      await expect(pages.operatorForm.headingAddDetails).toBeVisible();
      await expect(pages.operatorForm.inputApprovalNumber).toBeVisible();
      await expect(pages.operatorForm.transporterCategoryGroup).toBeVisible();
      await expect(pages.operatorForm.radioTransporterCategory('PRIVATE')).toBeVisible();
      await expect(pages.operatorForm.radioTransporterCategory('COMMERCIAL')).toBeVisible();
    });

    test('choosing Consignor shows neither conditional field', async ({ pages }) => {
      await pages.addressBook.btnAddNewOperator.click();
      await pages.addOperatorType.radioByValue('CONSIGNOR').check();
      await pages.addOperatorType.btnContinue.click();

      await expect(pages.operatorForm.headingAddDetails).toBeVisible();
      await expect(pages.operatorForm.inputApprovalNumber).toHaveCount(0);
      await expect(pages.operatorForm.transporterCategoryGroup).toHaveCount(0);
    });

    test('shows field errors when the details form is submitted empty', async ({ pages }) => {
      await pages.addressBook.btnAddNewOperator.click();
      await pages.addOperatorType.radioByValue('CONSIGNOR').check();
      await pages.addOperatorType.btnContinue.click();
      await pages.operatorForm.headingAddDetails.waitFor();

      await pages.operatorForm.btnSaveChanges.click();

      await expect(pages.operatorForm.errorSummary).toBeVisible();
      await expect(pages.operatorForm.errorSummaryLink('Enter a name')).toBeVisible();
      await expect(pages.operatorForm.errorSummaryLink('Enter a postcode')).toBeVisible();
      await expect(pages.operatorForm.errorSummaryLink('Select a country')).toBeVisible();
      await expect(pages.operatorForm.errorSummaryLink('Enter an email address')).toBeVisible();
    });
  });

  test.describe('Add — success', () => {
    test('adds an operator and shows the success banner and new row', async ({ pages }) => {
      const name = `Playwright Added ${Date.now()}`;
      await addOperator(pages, name);

      await expect(pages.addressBook.banner).toHaveText(`${name} operator added`);

      await pages.addressBook.openWithParams({ q: name });
      await expect(pages.addressBook.row(name)).toBeVisible();
    });
  });

  test.describe('View', () => {
    test('shows a seeded transporter with its address, country and conditional fields', async ({ pages }) => {
      await pages.addressBook.openWithParams({ q: TRANSPORTER_OPERATOR.name });
      await pages.addressBook.viewLink(TRANSPORTER_OPERATOR.name).click();

      await expect(pages.viewOperator.heading).toHaveText(TRANSPORTER_OPERATOR.name);
      await expect(pages.viewOperator.rowValue('Name')).toHaveText(TRANSPORTER_OPERATOR.name);
      await expect(pages.viewOperator.rowValue('Type')).toHaveText(TRANSPORTER_OPERATOR.type);
      await expect(pages.viewOperator.rowValue('Address')).toHaveText(TRANSPORTER_OPERATOR.address);
      await expect(pages.viewOperator.rowValue('Country')).toHaveText(TRANSPORTER_OPERATOR.country);
      await expect(pages.viewOperator.rowValue('Approval number')).toHaveText(TRANSPORTER_OPERATOR.approvalNumber);
      await expect(pages.viewOperator.rowValue('Transporter category')).toHaveText(TRANSPORTER_OPERATOR.transporterCategory);
      await expect(pages.viewOperator.btnEdit).toBeVisible();
      await expect(pages.viewOperator.btnDelete).toBeVisible();
    });
  });

  test.describe('Edit', () => {
    test('edits an operator and shows the updated banner', async ({ pages }) => {
      const name = `Playwright Edit ${Date.now()}`;
      const updatedName = `${name} EDITED`;
      await addOperator(pages, name);

      await pages.addressBook.openWithParams({ q: name });
      await pages.addressBook.viewLink(name).click();
      await pages.viewOperator.btnEdit.click();

      await expect(pages.operatorForm.headingEditDetails).toBeVisible();
      await pages.operatorForm.inputName.fill(updatedName);
      await pages.operatorForm.btnSaveChanges.click();

      await expect(pages.addressBook.heading).toBeVisible();
      await expect(pages.addressBook.banner).toHaveText(`${updatedName} operator updated`);
    });

    test('cancelling an edit does not save the change', async ({ pages }) => {
      const name = `Playwright Cancel ${Date.now()}`;
      const abandonedName = `${name} ABANDONED`;
      await addOperator(pages, name);

      await pages.addressBook.openWithParams({ q: name });
      await pages.addressBook.viewLink(name).click();
      await pages.viewOperator.btnEdit.click();
      await pages.operatorForm.headingEditDetails.waitFor();
      await pages.operatorForm.inputName.fill(abandonedName);
      await pages.operatorForm.btnCancel.click();

      await expect(pages.addressBook.heading).toBeVisible();
      await expect(pages.addressBook.banner).toHaveCount(0);

      await pages.addressBook.openWithParams({ q: name });
      await expect(pages.addressBook.row(name)).toBeVisible();
      await pages.addressBook.openWithParams({ q: abandonedName });
      await expect(pages.addressBook.emptyMessage).toBeVisible();
    });
  });

  test.describe('Delete', () => {
    test('deletes an operator via the confirmation page and shows the deleted banner', async ({ pages }) => {
      const name = `Playwright Delete ${Date.now()}`;
      await addOperator(pages, name);

      await pages.addressBook.openWithParams({ q: name });
      await pages.addressBook.viewLink(name).click();
      await pages.viewOperator.btnDelete.click();

      await expect(pages.deleteOperator.heading).toBeVisible();
      await expect(pages.deleteOperator.confirmationText).toContainText(name);
      await expect(pages.deleteOperator.warning).toBeVisible();

      await pages.deleteOperator.btnDelete.click();

      await expect(pages.addressBook.heading).toBeVisible();
      await expect(pages.addressBook.banner).toHaveText(`${name} operator deleted`);

      await pages.addressBook.openWithParams({ q: name });
      await expect(pages.addressBook.emptyMessage).toBeVisible();
    });
  });
});
