import { test, expect } from '@fixtures';

test.describe('Destination selection', () => {
  test.beforeEach(async ({ journeys, pages }) => {
    await journeys.toAddresses();
    await pages.addresses.linkAddPlaceOfDestination.click();
  });

  test('shows system-generated notification id (draft)', async ({ journeyContext, pages }) => {
    const notificationId = await pages.destinationSelection.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.destinationSelection.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows matching destination details when selecting the first destination', async ({ pages }) => {
    await pages.destinationSelection.linkSelectDestination(0).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsPlaceOfDestination;
    await expect(cells.nth(0)).toHaveText('Tech Imports Ltd');
    await expect(cells.nth(1)).toHaveText('643 Main Street, Birmingham G1 3AZ');
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });

  test('shows matching destination details when selecting a different destination', async ({ pages }) => {
    const destinationName = 'Global Trading Co';
    await pages.destinationSelection.linkSelectDestinationByName(destinationName).click();
    await expect(pages.page).toHaveURL(new RegExp(pages.addresses.expectedUrl));
    await expect(pages.addresses.heading).toBeVisible();

    const cells = pages.addresses.cellsPlaceOfDestination;
    await expect(cells.nth(0)).toHaveText(destinationName);
    await expect(cells.nth(1)).toHaveText('945 Main Street, London LS1 5AB');
    await expect(cells.nth(2)).toHaveText('United Kingdom');
  });
});
