import { test } from '@fixtures';

test.describe('Test group', () => {
  test('seed', async ({ pages }) => {
    await pages.notificationDashboard.open();
  });
});
