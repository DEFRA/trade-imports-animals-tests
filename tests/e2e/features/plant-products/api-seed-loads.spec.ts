import { test, expect } from '@fixtures';

const seededDraftReference = 'GBN-PP-26-SEED01';
const seededDeletedReference = 'GBN-PP-26-SEED04';

test(
  'the database reseed loads known plant-products notifications in their expected states',
  { tag: '@integration' },
  async ({ plantProductsApi }) => {
    const [draft, deleted] = await Promise.all([
      plantProductsApi.load(seededDraftReference),
      plantProductsApi.load(seededDeletedReference),
    ]);

    expect(draft).toMatchObject({ referenceNumber: seededDraftReference, status: 'DRAFT' });
    expect(deleted).toMatchObject({ referenceNumber: seededDeletedReference, status: 'DELETED' });
  },
);

test(
  'an API-seeded plant-products draft loads through the frontend and renders the hub',
  { tag: '@integration' },
  async ({ plantProductsApiJourney: apiJourney, plantProductsPages: pages }) => {
    const created = await apiJourney.createFullNotification();

    await pages.page.goto(`/plant-products/notifications/${created.referenceNumber}`);
    await expect(pages.signIn.heading).toBeVisible();
    await pages.signIn.signIn();

    await expect(pages.page).toHaveURL(`/plant-products/notifications/${created.referenceNumber}`);
    await expect(pages.page.getByRole('heading', { level: 1, name: 'Notification overview' })).toBeVisible();
    await expect(pages.page.getByText(created.referenceNumber, { exact: true })).toBeVisible();
  },
);

test(
  'the dashboard lists the seeded draft but never lists the DELETED notification',
  { tag: '@integration' },
  async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.toNotificationDashboard();

    await expect(pages.plantNotificationDashboard.row(seededDraftReference)).toBeVisible();
    await expect(pages.plantNotificationDashboard.row(seededDeletedReference)).toHaveCount(0);
  },
);
