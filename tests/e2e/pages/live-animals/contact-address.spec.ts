import { test, expect } from '@fixtures';

test.describe('Contact address page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ liveAnimalsJourney: journey }) => {
    await journey.toContactAddress();
  });

  test('renders the page controls', async ({ liveAnimalsPages: pages }) => {
    await expect(pages.contactAddress.heading).toBeVisible();
    await expect(pages.contactAddress.address('Animal and Plant Health Agency')).toBeVisible();
    await expect(pages.contactAddress.saveAndContinue).toBeVisible();
  });

  test('leaves the contact address unchecked on load', async ({ liveAnimalsPages: pages }) => {
    await expect(pages.contactAddress.address('Animal and Plant Health Agency')).not.toBeChecked();
  });

  test('accepts a valid contact address', async ({ liveAnimalsPages: pages }) => {
    await pages.contactAddress.address('Animal and Plant Health Agency').check();
    await pages.contactAddress.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('saving with no contact address selected is allowed and exits to the hub', async ({ liveAnimalsPages: pages }) => {
    await pages.contactAddress.saveAndContinue.click();

    await expect(pages.overview.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('adding a new contact address saves it and offers it selected', async ({ liveAnimalsPages: pages }) => {
    // The book is a persistent server store, so a fresh unique name each run keeps
    // the created record unambiguous among the offered radios.
    const createdName = `Created Contact ${Date.now()}`;

    await pages.page.getByRole('link', { name: 'Add a new contact address' }).click();
    await expect(pages.page.getByRole('heading', { name: 'Add a new address' })).toBeVisible();

    await pages.page.getByLabel('Name or organisation name').fill(createdName);
    await pages.page.getByLabel('Address line 1').fill('12 Contact Way');
    await pages.page.getByLabel('Town or city').fill('Penrith');
    await pages.page.getByLabel('Postal or zip code').fill('CA11 7AA');
    await pages.page.getByLabel('Country').selectOption('United Kingdom');
    await pages.page.getByLabel('Telephone number').fill('01768 555 0102');
    await pages.page.getByLabel('Email address').fill('contact@example.co.uk');
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();

    await expect(pages.contactAddress.heading).toBeVisible();
    await expect(pages.contactAddress.address(createdName)).toBeChecked();
  });
});
