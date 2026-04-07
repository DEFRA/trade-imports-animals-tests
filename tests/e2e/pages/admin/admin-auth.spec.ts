import { test, expect } from '@fixtures';

test.describe('Authentication (admin)', { tag: '@auth' }, () => {
  test.beforeEach(async ({ journeys, pages }) => {
    await journeys.toSignIn((attemptSignIn) => pages.adminDashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the admin dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
  });

  test('allows signing into the admin dashboard', async ({ pages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
    await expect(pages.adminDashboard.headingPage).toHaveText(pages.adminDashboard.expectedHeading);
  });

  test('displays an error message when signing in with empty credentials', async ({ pages }) => {
    await pages.signIn.signIn({ userId: '', password: '' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('displays an error message when signing in with empty password', async ({ pages }) => {
    await pages.signIn.signIn({ password: '' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('allows signing out after signing in', async ({ pages }) => {
    await pages.signIn.signIn();
    await pages.adminDashboard.btnSignOut.click();
    await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
    await expect(pages.signOut.headingPage).toHaveText(pages.signOut.expectedHeading);
  });

  test('lands on the sign in page when reopening the admin dashboard after sign out', async ({ pages }) => {
    await pages.signIn.signIn();
    await pages.adminDashboard.btnSignOut.click();
    await pages.adminDashboard.open(false);
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
  });

  test.describe('Notifications (admin) (unauthenticated entry)', () => {
    test.beforeEach(async ({ journeys, pages }) => {
      await journeys.toSignIn((attemptSignIn) => pages.adminNotifications.open(attemptSignIn));
    });

    test('lands on the sign in page when opening a page further in the journey', async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
      await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
    });

    test('allows signing into a page further in the journey', async ({ pages }) => {
      await pages.signIn.signIn();
      await expect(pages.page).toHaveURL(pages.adminNotifications.expectedUrl);
      await expect(pages.adminNotifications.headingPage).toHaveText(pages.adminNotifications.expectedHeading);
    });
  });
});
