import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Import notification service | Animals');
});

test('intentionally fails when expecting incorrect title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Import notification service | Plants');
});
