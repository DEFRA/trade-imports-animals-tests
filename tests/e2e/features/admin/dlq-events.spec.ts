import { test, expect } from '@fixtures';
import type { PageObjects } from '@page-objects';
import { SqsClient } from '@adapters/queue/sqs-client';
import { seedDlqMessage } from '@domain/fixtures/dlq-event';
import { timeouts } from '@config/timeouts';

// Delete-all flakes roughly one run in four and the cause is not established.
// The default 'on-first-retry' keeps a trace of the attempt that passed, never
// of the one that failed, so the failure has never been observable.
test.use({ trace: 'retain-on-failure' });

/**
 * Confirm the seeded message is listed on the DLQ page. The list is fetched on page load, so a
 * message that arrived after the render needs a fresh page rather than a wait on stale content.
 */
async function expectSeededRowListed(pages: PageObjects, eventId: string): Promise<void> {
  await expect(async () => {
    // Reload every attempt. The previous form asked a non-waiting isVisible()
    // first and reloaded only when it said no, so a slow render could skip the
    // reload and then assert against the page that never had the row. The
    // reload settles on 'load', which also means the page's own script has run
    // before anything clicks the buttons it wires up.
    await pages.page.reload();
    await expect(pages.adminDlqEvents.rowById(eventId)).toBeVisible({ timeout: timeouts.short });
  }).toPass({ timeout: timeouts.medium });
}

test.describe('DLQ operator actions', { tag: '@compose' }, () => {
  // Serial: both tests act on the whole DLQ (replay-all / delete-all), so they must not run
  // concurrently against the one shared queue.
  test.describe.configure({ mode: 'serial' });

  let sqs: SqsClient;

  test.beforeAll(() => {
    sqs = new SqsClient();
  });

  test.afterAll(() => {
    sqs.destroy();
  });

  test('replays all DLQ messages via the admin UI', async ({ adminNavigation, pages }) => {
    const eventId = await seedDlqMessage(sqs);

    await adminNavigation.toDlqEvents();
    await expectSeededRowListed(pages, eventId);

    await pages.adminDlqEvents.btnReplayAll.click();

    // The success banner renders only after the real gateway replay-all call (with the real admin
    // secret) succeeded — the cross-service wiring this test exists to prove.
    await expect(pages.adminDlqEvents.bannerSuccess).toContainText('Replay-all started');
  });

  test('deletes all DLQ messages via the admin UI', async ({ adminNavigation, pages }) => {
    const eventId = await seedDlqMessage(sqs);

    await adminNavigation.toDlqEvents();
    await expectSeededRowListed(pages, eventId);

    // Delete all opens a dialog rather than submitting, and the confirm button
    // inside it is inert until it does. Gate on the dialog so a click that
    // failed to open it fails here, naming the cause, instead of timing out on
    // a button that was never reachable.
    await pages.adminDlqEvents.btnDeleteAll.click();
    await expect(pages.adminDlqEvents.deleteAllDialog).toBeVisible();
    await pages.adminDlqEvents.btnConfirmDeleteAll.click();

    // As above: the banner is proof the real gateway delete-all call succeeded.
    await expect(pages.adminDlqEvents.bannerSuccess).toContainText('Delete-all started');
  });
});
