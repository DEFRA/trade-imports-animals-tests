import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';

// These tests ARE the sign-in journey, so they start unauthenticated.
test.use({ storageState: COLD_START });

test.describe('Authentication (high-risk plants)', { tag: ['@auth', '@integration'] }, () => {
  test.beforeEach(async ({ journey, pages }) => {
    await journey.toSignIn((attemptSignIn) => pages.plantsDashboard.open(attemptSignIn));
  });

  test('lands on the sign in page when opening the plants dashboard', async ({ pages }) => {
    await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
    await expect(pages.signIn.heading).toBeVisible();
  });

  test('allows signing into the plants dashboard', { tag: '@smoke' }, async ({ pages }) => {
    await pages.signIn.signIn();
    await expect(pages.page).toHaveURL(pages.plantsDashboard.expectedUrl);
    await expect(pages.plantsDashboard.heading).toBeVisible();
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
});
