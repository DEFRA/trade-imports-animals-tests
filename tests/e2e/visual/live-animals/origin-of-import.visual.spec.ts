import { test, expect } from '@fixtures';

// Override headless: headed mode uses OS font rendering, producing pixel differences against a headless baseline.
test.use({ headless: true });

test.describe('Origin of import (visual regression)', { tag: '@visual' }, () => {
  test.beforeEach(async ({ liveAnimalsJourney: journey }) => {
    await journey.toOriginOfImport();
  });

  test('shows expected page appearance on first load', async ({ page, liveAnimalsPages: pages }) => {
    await expect(page).toHaveScreenshot('origin-of-import.png', { fullPage: true, mask: [pages.originOfImport.user()] });
  });
});
