import { test, expect } from '@fixtures/security';

test.describe('Security scan (backend)', { tag: '@security' }, () => {
  test('routes a submitted notification through the ZAP proxy', async ({ proxiedApiJourney }) => {
    test.slow();
    const notification = await proxiedApiJourney.createSubmittedNotification();

    expect(notification.status).toBe('SUBMITTED');
  });
});
