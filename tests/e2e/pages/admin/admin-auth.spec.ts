// TODO EUDPA-52: Enable/refactor admin basic-auth tests when functionality is available.
// test.describe('Admin authentication', { tag: '@auth' }, () => {
//   test.beforeEach(async ({ pages }) => {
//     await pages.adminDashboard.open(false);
//   });
//
//   test('lands on the sign in page when opening the admin dashboard', async ({ pages }) => {
//     await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
//     await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
//   });
//
//   test('allows signing into the admin dashboard', async ({ pages }) => {
//     await pages.signIn.signIn();
//     await expect(pages.page).toHaveURL(pages.adminDashboard.expectedUrl);
//     await expect(pages.adminDashboard.headingPage).toHaveText(pages.adminDashboard.expectedHeading);
//   });
//
//   test('displays an error message when signing in with empty credentials', async ({ pages }) => {
//     await pages.signIn.signIn({ userId: '', password: '' });
//     await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
//     await expect(pages.signIn.errorSummaryItems).toContainText("Enter a valid 10-digit customer reference number (CRN) and password");
//   });
//
//   test('displays an error message when signing in with empty password', async ({ pages }) => {
//     await pages.signIn.signIn({ password: '' });
//     await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
//     await expect(pages.signIn.errorSummaryItems).toContainText("Enter a valid 10-digit customer reference number (CRN) and password");
//   });
//
//   test('allows signing out after signing in', async ({ pages }) => {
//     await pages.signIn.signIn();
//     await pages.adminDashboard.btnSignOut.click();
//     await expect(pages.page).toHaveURL(pages.signOut.expectedUrl);
//     await expect(pages.signOut.headingPage).toHaveText(pages.signOut.expectedHeading);
//   });
//
//   test('lands on the sign in page when reopening the admin dashboard after sign out', async ({ pages }) => {
//     await pages.signIn.signIn();
//     await pages.adminDashboard.btnSignOut.click();
//     await pages.adminDashboard.open(false);
//     await expect(pages.page).toHaveURL(pages.signIn.expectedUrl);
//     await expect(pages.signIn.headingPage).toHaveText(pages.signIn.expectedHeading);
//   });
// });
