import { test, expect } from '@fixtures';

test.describe('Animal identification page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAnimalIdentification();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.animalIdentification.heading).toBeVisible();
    await expect(pages.animalIdentification.earTag).toBeVisible();
    await expect(pages.animalIdentification.passportNumber).toBeVisible();
    await expect(pages.animalIdentification.saveAndAddAnother).toBeVisible();
    await expect(pages.animalIdentification.saveAndFinish).toBeVisible();
  });

  test('leaves the ear tag empty on load', async ({ pages }) => {
    await expect(pages.animalIdentification.earTag).toHaveValue('');
  });

  test('accepts a valid ear tag', async ({ pages }) => {
    await pages.animalIdentification.earTag.fill('UK123456789012');
    await pages.animalIdentification.saveAndFinish.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
