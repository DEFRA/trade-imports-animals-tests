import { test, expect } from '@fixtures';

test.describe('Declaration page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('shows an error summary when submitted unconfirmed', async ({ journey, pages }) => {
    await journey.toDeclaration();

    await pages.declaration.continueButton.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
