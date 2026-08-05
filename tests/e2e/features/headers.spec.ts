import { test, expect } from '@fixtures';

test('promoted frontend sends a Content-Security-Policy header', { tag: '@integration' }, async ({ journey, pages }) => {
  await journey.toNotificationDashboard();
  const responsePromise = pages.page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/' && response.request().resourceType() === 'document',
  );
  await pages.page.reload();
  const response = await responsePromise;
  expect(response.headers()['content-security-policy']).toBeTruthy();
});
