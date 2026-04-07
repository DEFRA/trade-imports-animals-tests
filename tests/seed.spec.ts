import { test } from '@fixtures';

test.describe('Test group', { tag: '@agent' }, () => {
  test('seed', async ({ journeys }) => {
    await journeys.toNotificationDashboard();
  });
});
