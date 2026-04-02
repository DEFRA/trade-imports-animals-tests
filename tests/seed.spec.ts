import { test } from '@fixtures';

test.describe('Test group', { tag: '@agent-only' }, () => {
  test('seed', async ({ journeys }) => {
    await journeys.toNotificationDashboard();
  });
});
