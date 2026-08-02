import { test, expect } from '@fixtures';

test.describe('Declaration page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ liveAnimalsJourney: journey }) => {
    await journey.toDeclaration();
  });

  test('renders the page controls', async ({ liveAnimalsPages: pages }) => {
    await expect(pages.declaration.heading).toBeVisible();
    await expect(pages.declaration.confirmation).toBeVisible();
    await expect(pages.declaration.continueButton).toBeVisible();
  });

  test('shows an error summary when submitted unconfirmed', async ({ liveAnimalsPages: pages }) => {
    await pages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
