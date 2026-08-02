import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from '@fixtures';
import type { AdminPageObjects } from '@page-objects';
import { SqsClient } from '@adapters/queue/sqs-client';
import { getDlqUrl } from '@config/service-base-urls';
import { outboxEventPaths } from '@resources/outbox-events/paths';
import { timeouts } from '@config/timeouts';

interface OutboxEventFixture {
  eventId: string;
  aggregateId: string;
  metadata: Record<string, unknown>;
  [key: string]: unknown;
}

const dlqEventTemplate = JSON.parse(readFileSync(outboxEventPaths.notificationSubmitted, 'utf-8')) as OutboxEventFixture;

/**
 * Seed one message directly onto the DLQ — the same shortcut the gateway's DlqServiceIT uses.
 * eventId (shown by the admin UI as the message Id) and the FIFO group are unique per seed, so a
 * run's assertions can't collide with, or be FIFO-blocked behind, a message left by another test.
 * Returns the eventId.
 */
async function seedDlqMessage(sqs: SqsClient): Promise<string> {
  const eventId = randomUUID();
  const aggregateId = `${dlqEventTemplate.aggregateId}.${eventId}`;
  const event = {
    ...dlqEventTemplate,
    eventId,
    aggregateId,
    metadata: { ...dlqEventTemplate.metadata, correlationId: eventId },
  };
  await sqs.sendMessage(getDlqUrl(), JSON.stringify(event), aggregateId, eventId);
  return eventId;
}

/**
 * Confirm the seeded message is listed on the DLQ page. The list is fetched on page load, so if the
 * just-seeded message hasn't propagated yet, reload and re-check rather than waiting on stale content.
 */
async function expectSeededRowListed(pages: AdminPageObjects, eventId: string): Promise<void> {
  await expect(async () => {
    if (!(await pages.adminDlqEvents.rowById(eventId).isVisible())) {
      await pages.page.reload();
    }
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

  test('replays all DLQ messages via the admin UI', async ({ adminNavigation, adminPages: pages }) => {
    const eventId = await seedDlqMessage(sqs);

    await adminNavigation.toDlqEvents();
    await expectSeededRowListed(pages, eventId);

    await pages.adminDlqEvents.btnReplayAll.click();

    // The success banner renders only after the real gateway replay-all call (with the real admin
    // secret) succeeded — the cross-service wiring this test exists to prove.
    await expect(pages.adminDlqEvents.bannerSuccess).toContainText('Replay-all started');
  });

  test('deletes all DLQ messages via the admin UI', async ({ adminNavigation, adminPages: pages }) => {
    const eventId = await seedDlqMessage(sqs);

    await adminNavigation.toDlqEvents();
    await expectSeededRowListed(pages, eventId);

    await pages.adminDlqEvents.btnDeleteAll.click();
    await pages.adminDlqEvents.btnConfirmDeleteAll.click();

    // As above: the banner is proof the real gateway delete-all call succeeded.
    await expect(pages.adminDlqEvents.bannerSuccess).toContainText('Delete-all started');
  });
});
