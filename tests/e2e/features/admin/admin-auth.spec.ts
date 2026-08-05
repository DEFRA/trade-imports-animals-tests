import { test, expect } from '@fixtures';

// Signs in, signs out and enters unauthenticated by design. A restored session would skip
// the form entirely — the identity provider auto-completes for a browser it already knows.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication (admin)', { tag: '@auth' }, () => {
  test.beforeEach(async ({ liveAnimalsJourney: journey, adminPages: pages }) => {
    await journey.toSignIn((attemptSignIn) => pages.adminDashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the admin dashboard', async ({ adminPages: pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test('allows signing into the admin dashboard', { tag: '@smoke' }, async ({ adminPages: pages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
    await expect(pages.adminDashboard.heading).toBeVisible();
  });

  test('displays an error message when signing in with empty credentials', async ({ adminPages: pages }) => {
    await pages.signIn.signIn({ userId: '', password: '' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('displays an error message when signing in with empty password', async ({ adminPages: pages }) => {
    await pages.signIn.signIn({ password: '' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('allows signing out after signing in', async ({ adminPages: pages }) => {
    await pages.signIn.signIn();
    await pages.adminDashboard.linkSignOut.click();
    await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
    await expect(pages.signOut.heading).toBeVisible();
  });

  test('displays signed in user after signing in', async ({ adminPages: pages }) => {
    await pages.signIn.signIn();
    await expect(pages.adminDashboard.user()).toBeVisible();
  });

  test('lands on the sign in page when reopening the admin dashboard after sign out', async ({ adminPages: pages }) => {
    await pages.signIn.signIn();
    await pages.adminDashboard.linkSignOut.click();
    await pages.adminDashboard.open(false);
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test.describe('Notifications (admin) (unauthenticated entry)', () => {
    test.beforeEach(async ({ liveAnimalsJourney: journey, adminPages: pages }) => {
      await journey.toSignIn((attemptSignIn) => pages.adminNotifications.open(attemptSignIn));
    });

    test('lands on the sign in page when opening a page further in the journey', async ({ adminPages: pages }) => {
      await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
      await expect(pages.signIn.heading).toBeVisible();
    });

    test('allows signing into a page further in the journey', async ({ adminPages: pages }) => {
      await pages.signIn.signIn();
      await expect(pages.page).toHaveURL(pages.adminNotifications.expectedUrl);
      await expect(pages.adminNotifications.heading).toBeVisible();
    });
  });
});
