import { test, expect } from '@fixtures/security';

/**
 * Puts the backend's own notification API through the scanner.
 *
 * Everything else seeds through the frontend now, which would leave this
 * surface unscanned — so this one spec keeps talking to the backend directly.
 * It stays as thin as that purpose allows: create and submit, with an empty
 * notification, so it carries no obligation ids and no payload shape. What is
 * being scanned is the endpoints, not the content.
 */
test.describe('Security scan (backend)', { tag: '@active' }, () => {
  test('routes a submitted notification through the ZAP proxy', async ({ proxiedNotificationApi }) => {
    const draft = await proxiedNotificationApi.createNotification();
    const submitted = await proxiedNotificationApi.submitNotification(draft.referenceNumber);

    expect(submitted.status).toBe('SUBMITTED');
  });
});
