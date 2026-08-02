import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

test(
  'submits a promoted live-animals notification through the hub-owned spine',
  { tag: ['@compose', '@integration'] },
  async ({ journey, pages, journeyContext }) => {
    test.slow();
    await journey.submitNotification();

    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
    await expect(pages.page).toHaveURL((url) =>
      new RegExp(`^${SET_BASES.liveAnimals}/notifications/${journeyContext.journeyId}/confirmation$`).test(url.pathname),
    );
    await expect(pages.page.locator('.govuk-panel')).toContainText(journeyContext.journeyId);
  },
);
