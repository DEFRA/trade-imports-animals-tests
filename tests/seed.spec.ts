import { test } from '@fixtures';

test.describe('Test group', { tag: '@agent-only' }, () => {
  test('seed', async ({ pages }) => {
    await pages.notificationDashboard.open();
  });
});
