import { test, expect } from '@fixtures';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { SET_BASES } from '@page-objects/base/sets';

test(
  'cold deep links are isolated by set and each reaches only its own import-type filter',
  { tag: '@integration' },
  async ({ browser, liveAnimalsApiJourney, plantProductsApiJourney }) => {
    const baseURL = process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL;
    if (!baseURL) throw new Error('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL is not set');
    const [plantNotification, liveNotification] = await Promise.all([
      plantProductsApiJourney.createEmptyNotification(),
      liveAnimalsApiJourney.createEmptyNotification(),
    ]);

    const plantContext = await browser.newContext({ baseURL });
    const liveContext = await browser.newContext({ baseURL });
    try {
      const plantPage = await plantContext.newPage();
      const livePage = await liveContext.newPage();
      await Promise.all([
        (async () => {
          await plantPage.goto(`${SET_BASES.plantProducts}/notifications/${plantNotification.referenceNumber}/about-the-consignment`);
          await new SignInPage(plantPage).signIn();
        })(),
        (async () => {
          await livePage.goto(`${SET_BASES.liveAnimals}/notifications/${liveNotification.id}/origin`);
          await new SignInPage(livePage).signIn();
        })(),
      ]);

      await expect
        .soft(plantPage)
        .toHaveURL((url) =>
          new RegExp(`^${SET_BASES.plantProducts}/notifications/${plantNotification.referenceNumber}/import-type$`).test(url.pathname),
        );
      await expect
        .soft(livePage)
        .toHaveURL((url) => new RegExp(`^${SET_BASES.liveAnimals}/notifications/${liveNotification.id}/import-type$`).test(url.pathname));
      expect.soft(new URL(plantPage.url()).pathname).not.toContain(SET_BASES.liveAnimals);
      expect.soft(new URL(livePage.url()).pathname).not.toContain(SET_BASES.plantProducts);
    } finally {
      await Promise.all([plantContext.close(), liveContext.close()]);
    }
  },
);
