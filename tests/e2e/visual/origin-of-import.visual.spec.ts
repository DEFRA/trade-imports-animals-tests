import { test, expect } from '@fixtures';

// Override headless: headed mode uses OS font rendering, producing pixel differences against a headless baseline.
test.use({ headless: true });

test.describe('Origin of import (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toOriginOfImport();
  });

  // No mask: the page no longer shows the signed-in user's email address, so there is nothing varying to hide.
  test('shows expected page appearance on first load', async ({ page }) => {
    await expect(page).toHaveScreenshot('origin-of-import.png', { fullPage: true });
  });
});
