import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

test('promoted frontend sends a Content-Security-Policy header', { tag: '@integration' }, async ({ journey, pages }) => {
  await journey.toNotificationDashboard();
  const responsePromise = pages.page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === SET_BASES.liveAnimals &&
      response.request().resourceType() === 'document' &&
      response.status() === 200,
  );
  await pages.page.reload();
  const response = await responsePromise;
  expect(response.headers()['content-security-policy']).toBeTruthy();
});
