import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

// The GET /signout below drops the server-side session for whichever sessionId the context
// holds. On a restored session that is the worker's session, so this spec runs cold.
test.use({ storageState: { cookies: [], origins: [] } });

test(
  'keeps both deployed sets and their drafts isolated with one shared session and server-wide routes',
  { tag: ['@compose', '@integration'] },
  async ({ page, liveAnimalsJourney, plantProductsJourney, liveAnimalsPages, plantProductsPages }) => {
    const liveAnimalsReference = await liveAnimalsJourney.startNotification();
    await expect(page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/${liveAnimalsReference}$`).test(url.pathname),
    );
    const root = await page.request.get('/', { maxRedirects: 0 });
    expect(root.status()).toBe(302);
    expect(root.headers().location).toBe(SET_BASES.liveAnimals);

    const plantProductsReference = await plantProductsJourney.startNotification();
    await expect(page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.plantProducts}/notifications/${plantProductsReference}$`).test(url.pathname),
    );

    const stylesheetHref = await page.locator('link[rel="stylesheet"]').first().getAttribute('href');
    expect(stylesheetHref).toBeTruthy();
    const stylesheetPath = new URL(stylesheetHref, page.url()).pathname;
    expect(stylesheetPath).not.toMatch(new RegExp(`^${SET_BASES.liveAnimals}(?:/|$)`));
    expect(stylesheetPath).not.toMatch(new RegExp(`^${SET_BASES.plantProducts}(?:/|$)`));

    await liveAnimalsPages.overview.open(liveAnimalsReference, false);
    await expect(page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/${liveAnimalsReference}$`).test(url.pathname),
    );
    await expect(liveAnimalsPages.overview.heading).toBeVisible();
    await plantProductsPages.countryOfOrigin.open(plantProductsReference, false);
    await expect(page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.plantProducts}/notifications/${plantProductsReference}/country-of-origin$`).test(url.pathname),
    );
    await expect(plantProductsPages.countryOfOrigin.heading).toBeVisible();

    await liveAnimalsPages.notificationDashboard.open(false);
    await liveAnimalsPages.notificationDashboard.heading.waitFor();
    await liveAnimalsPages.notificationDashboard.searchForReference(liveAnimalsReference);
    await expect(liveAnimalsPages.notificationDashboard.notificationCard(liveAnimalsReference)).toBeVisible();
    await liveAnimalsPages.notificationDashboard.searchForReference(plantProductsReference);
    await expect(liveAnimalsPages.notificationDashboard.notificationCard(plantProductsReference)).toHaveCount(0);

    await plantProductsPages.plantNotificationDashboard.open(false);
    await plantProductsPages.plantNotificationDashboard.searchForReference(plantProductsReference);
    await expect(plantProductsPages.plantNotificationDashboard.row(plantProductsReference)).toBeVisible();
    await plantProductsPages.plantNotificationDashboard.searchForReference(liveAnimalsReference);
    await expect(plantProductsPages.plantNotificationDashboard.row(liveAnimalsReference)).toHaveCount(0);

    const sessionCookies = (await page.context().cookies()).filter(({ name }) => name === 'session');
    expect(sessionCookies.map(({ name, path }) => ({ name, path }))).toEqual([{ name: 'session', path: '/' }]);

    const plantUnderLiveAnimals = await page.request.get(`${SET_BASES.liveAnimals}/notifications/${plantProductsReference}`, {
      maxRedirects: 0,
    });
    const liveAnimalsUnderPlant = await page.request.get(`${SET_BASES.plantProducts}/notifications/${liveAnimalsReference}`, {
      maxRedirects: 0,
    });
    const plantUnderLiveAnimalsBody = await plantUnderLiveAnimals.text();
    expect(plantUnderLiveAnimalsBody).not.toContain(plantProductsReference);
    expect(plantUnderLiveAnimalsBody).not.toContain('Notification overview');
    const liveAnimalsUnderPlantBody = await liveAnimalsUnderPlant.text();
    expect(liveAnimalsUnderPlantBody).not.toContain(liveAnimalsReference);
    expect(liveAnimalsUnderPlantBody).not.toContain('Where is this consignment coming from?');

    const health = await page.request.get('/health', { maxRedirects: 0 });
    const stylesheet = await page.request.get(stylesheetPath, { maxRedirects: 0 });
    const signout = await page.request.get('/signout', { maxRedirects: 0 });
    expect(health.status()).toBe(200);
    expect(stylesheet.status()).toBe(200);
    expect(signout.status()).toBe(302);
  },
);
