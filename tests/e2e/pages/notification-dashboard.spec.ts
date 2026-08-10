import { test, expect } from '@fixtures';

test.describe('Import notification service dashboard', { tag: '@integration' }, () => {
  test('starts a journey at the promoted import-type filter and lists the draft', async ({ journey, pages }) => {
    const journeyId = await journey.startNotification();

    await expect(pages.page).toHaveURL(new RegExp(`/notifications/${journeyId}$`));
    await expect(pages.overview.heading).toBeVisible();

    const card = pages.notificationDashboard.notificationCard(journeyId);
    await expect(async () => {
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(journeyId);
      await expect(card).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(card.getByText('Draft', { exact: true })).toBeVisible();
    await expect(pages.notificationDashboard.resume(journeyId)).toBeVisible();
    await expect(pages.notificationDashboard.copyAsNew(journeyId)).toBeVisible();
    await expect(pages.notificationDashboard.delete(journeyId)).toBeVisible();
  });

  test.describe('dashboard basics', () => {
    test('lands on the notification dashboard', { tag: '@smoke' }, async ({ journey, pages }) => {
      await journey.toNotificationDashboard();
      await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
      await expect(pages.notificationDashboard.heading).toBeVisible();
    });

    test('allows creating a new notification', async ({ journey, pages }) => {
      await journey.toNotificationDashboard();
      await pages.notificationDashboard.btnCreateNewNotification.click();
      await expect(pages.importType.heading).toBeVisible();
    });

    test('displays the notification list and result count', async ({ apiJourney, pages }) => {
      const created = await apiJourney.createFullNotification();
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(created.id);

      await expect(pages.notificationDashboard.heading).toBeVisible();
      await expect(pages.notificationDashboard.totalResults).toBeVisible();
      await expect(pages.notificationDashboard.notificationCards).toHaveCount(1);
    });

    test('displays details on a notification card', async ({ journey, journeyContext, pages }) => {
      test.slow();
      await journey.submitNotification();
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(journeyContext.journeyId);

      const details = pages.notificationDashboard.notificationCardDetails(0);
      await expect(details.heading).toContainText(journeyContext.journeyId);
      await expect(details.commodity).toBeVisible();
      await expect(details.origin).toBeVisible();
      await expect(details.arrivalAtDestination).toContainText(/\d{1,2} \w+ \d{4}/);
      await expect(details.status).toContainText('Submitted');
      await expect(details.dateCreated).toHaveText(/\d{1,2} \w+ \d{4}/);
    });
  });

  test.describe('notification card actions by status', () => {
    test('shows resume, copy and delete actions for a draft notification', async ({ pages, apiJourney }) => {
      const created = await apiJourney.createFullNotification();
      const referenceNumber = created.id;

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCardDetails(0).status).toContainText('Draft');
      await expect(pages.notificationDashboard.resume(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.copyAsNew(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.delete(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.amend(referenceNumber)).not.toBeVisible();
    });

    test('shows view, copy and amend actions for a submitted notification', async ({ pages, apiJourney }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.id;

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCardDetails(0).status).toContainText('Submitted');
      await expect(pages.notificationDashboard.view(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.copyAsNew(referenceNumber)).toBeVisible();
      await expect(pages.notificationDashboard.amend(referenceNumber)).toBeVisible();
    });

    test(
      'copies a submitted notification from its searched dashboard card',
      { tag: '@smoke' },
      async ({ pages, journey, journeyContext }) => {
        test.slow();
        await journey.submitNotification();
        const originalReferenceNumber = journeyContext.journeyId;

        await pages.notificationDashboard.open();
        await pages.notificationDashboard.searchForReference(originalReferenceNumber);
        await pages.notificationDashboard.copyAsNew(originalReferenceNumber).click();

        await pages.overview.heading.waitFor();
        const copiedReferenceNumber = (await pages.notificationView.referenceNumberCaption.textContent())?.match(
          /GBN-AG-\d{2}-[0-9A-Z]{6}/,
        )?.[0];
        expect(copiedReferenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
        expect(copiedReferenceNumber).not.toEqual(originalReferenceNumber);

        await pages.notificationDashboard.open();
        await pages.notificationDashboard.searchForReference(originalReferenceNumber);
        const sourceCard = pages.notificationDashboard.notificationCardDetails(0);
        await expect(sourceCard.heading).toContainText(originalReferenceNumber);
        const [commodity, origin, consignor, consignee, arrival] = await Promise.all([
          sourceCard.commodity.textContent(),
          sourceCard.origin.textContent(),
          sourceCard.consignor.textContent(),
          sourceCard.consignee.textContent(),
          sourceCard.arrivalAtDestination.textContent(),
        ]);
        await expect(sourceCard.status).toContainText('Submitted');

        await pages.notificationDashboard.open();
        await pages.notificationDashboard.searchForReference(copiedReferenceNumber);
        const copyCard = pages.notificationDashboard.notificationCardDetails(0);
        await expect(copyCard.heading).toContainText(copiedReferenceNumber);
        await expect(copyCard.status).toContainText('Draft');
        await expect(copyCard.commodity).toHaveText(commodity);
        await expect(copyCard.origin).toHaveText(origin);
        await expect(copyCard.consignor).toHaveText(consignor);
        await expect(copyCard.consignee).toHaveText(consignee);
        await expect(copyCard.arrivalAtDestination).toHaveText(arrival);
      },
    );
  });

  // Verified red-first against an unfixed frontend: copy and amend FAIL there,
  // delete and cancel-amend PASS. Those two route through a confirmation GET
  // that loads the journey, and loading adopts it into the session — so their
  // guard was never reachable from the dashboard. Keep them for the invariant
  // below, but do not read a green delete as proof the guard fix works.
  test.describe('actions on a notification this session never opened', () => {
    test('copies a submitted notification straight from its dashboard row', async ({ pages, apiJourney, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      const sourceReferenceNumber = created.id;

      await notificationActions.copyFromDashboard(sourceReferenceNumber);

      await expect(pages.overview.heading).toBeVisible();
      const copiedReferenceNumber = (await pages.notificationView.referenceNumberCaption.textContent())?.match(
        /GBN-AG-\d{2}-[0-9A-Z]{6}/,
      )?.[0];
      expect(copiedReferenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
      expect(copiedReferenceNumber).not.toEqual(sourceReferenceNumber);
    });

    test('amends a submitted notification straight from its dashboard row', async ({ pages, apiJourney, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.id;

      await notificationActions.amendNotification(referenceNumber);

      await expect(pages.overview.heading).toBeVisible();
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCardDetails(0).status).toContainText('Amending');
    });

    test('deletes a draft notification straight from its dashboard row', async ({ pages, apiJourney, notificationActions }) => {
      const created = await apiJourney.createFullNotification();
      const referenceNumber = created.id;

      await notificationActions.deleteNotification(referenceNumber);

      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCard(referenceNumber)).toHaveCount(0);
    });

    // The other half of the fix: an action that genuinely cannot proceed must
    // SAY so. Before the fix this redirected dashboard to dashboard, which is
    // indistinguishable from a refresh — the reported symptom.
    test('reports that a notification deleted behind the user cannot be copied', async ({
      pages,
      apiJourney,
      notificationApi,
    }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.id;

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.copyAsNew(referenceNumber)).toBeVisible();

      await notificationApi.softDeleteNotificationFulfilments(referenceNumber);
      await pages.notificationDashboard.copyAsNew(referenceNumber).click();

      await expect(pages.page.getByRole('heading', { name: 'You cannot copy this notification' })).toBeVisible();
      await expect(
        pages.page.getByText('It may have been deleted or changed since the list was loaded.'),
      ).toBeVisible();
    });

    test('cancels an amendment straight from its dashboard row', async ({ pages, apiJourney }) => {
      const created = await apiJourney.createAmendNotification();
      const referenceNumber = created.id;

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await pages.notificationDashboard.cancelAmend(referenceNumber).click();
      await pages.page.getByRole('button', { name: 'Yes, cancel amendment' }).click();

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.searchForReference(referenceNumber);
      await expect(pages.notificationDashboard.notificationCardDetails(0).status).toContainText('Submitted');
    });
  });
});
