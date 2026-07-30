import { test, expect } from '@fixtures';

test.describe('Contact address page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toContactAddress();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.contactAddress.heading).toBeVisible();
    await expect(pages.contactAddress.address('Animal and Plant Health Agency')).toBeVisible();
    await expect(pages.contactAddress.saveAndContinue).toBeVisible();
  });

  test('leaves the contact address unchecked on load', async ({ pages }) => {
    await expect(pages.contactAddress.address('Animal and Plant Health Agency')).not.toBeChecked();
  });

  test('accepts a valid contact address', async ({ pages }) => {
    await pages.contactAddress.address('Animal and Plant Health Agency').check();
    await pages.contactAddress.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
