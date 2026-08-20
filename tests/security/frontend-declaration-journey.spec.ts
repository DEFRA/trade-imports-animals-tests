import { test, expect } from '@fixtures';

test.describe('Security scan (frontend declaration)', { tag: '@security' }, () => {
  test('routes the journey through the ZAP proxy, stopping at Declaration unsubmitted', async ({ journey, pages }) => {
    test.slow();
    await journey.toDeclaration();

    await expect(pages.declaration.heading).toBeVisible();
    await expect(pages.declaration.confirmation).toBeVisible();
    await expect(pages.declaration.continueButton).toBeVisible();
  });
});
