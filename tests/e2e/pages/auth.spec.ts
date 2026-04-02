import { test, expect } from '@fixtures';

test.describe('Authentication', { tag: '@auth' }, () => {
  test.beforeEach(async ({ journeys, pages }) => {
    await journeys.toSignIn((attemptSignIn) => pages.notificationDashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the notification dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
  });

  test('allows signing into the notification dashboard', async ({ pages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(pages.notificationDashboard.expectedUrl);
    await expect(pages.notificationDashboard.headingPage).toHaveText(pages.notificationDashboard.expectedHeading);
  });

  test('displays an error message when signing in with invalid user id', async ({ pages }) => {
    await pages.signIn.signIn({ userId: 'invalid' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('displays an error message when signing in with invalid password', async ({ pages }) => {
    await pages.signIn.signIn({ password: 'invalid' });
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.errorSummary).toContainText('Enter a valid 10-digit customer reference number (CRN) and password');
  });

  test('allows signing out after signing in', async ({ pages }) => {
    await pages.signIn.signIn();
    await pages.notificationDashboard.btnSignOut.click();
    await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
    await expect(pages.signOut.headingPage).toHaveText(pages.signOut.expectedHeading);
  });

  test('lands on the sign in page when reopening the notification dashboard after sign out', async ({ pages }) => {
    await pages.signIn.signIn();
    await pages.notificationDashboard.btnSignOut.click();
    await pages.notificationDashboard.open(false);
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
  });

  test.describe('Origin of import (unauthenticated entry)', () => {
    test.beforeEach(async ({ journeys, pages }) => {
      await journeys.toSignIn((attemptSignIn) => pages.originOfImport.open(attemptSignIn));
    });

    test('lands on the sign in page when opening a page further in the journey', async ({ pages }) => {
      await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
      await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
    });

    test('allows signing into a page further in the journey', async ({ pages }) => {
      await pages.signIn.signIn();
      await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
      await expect(pages.originOfImport.headingPage).toHaveText(pages.originOfImport.expectedHeading);
    });
  });
});
