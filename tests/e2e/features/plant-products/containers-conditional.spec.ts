import { test, expect } from '@fixtures';

test(
  'containers retain ordered survivors and the true-to-false gate wipes the stored collection',
  { tag: '@integration' },
  async ({ plantProductsApiJourney: apiJourney, plantProductsApi, plantProductsPages: pages }) => {
    const created = await apiJourney.createFullNotification();
    await pages.transportBeforeBip.open(created.referenceNumber);
    await expect(pages.transportBeforeBip.usesContainers(true)).toBeChecked();
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(2);

    for (const [containerNumber, sealNumber] of [
      ['PP-CONT-2', 'PP-SEAL-2'],
      ['PP-CONT-3', 'PP-SEAL-3'],
    ]) {
      await pages.transportBeforeBip.containerNumber.fill(containerNumber);
      await pages.transportBeforeBip.sealNumber.fill(sealNumber);
      await pages.transportBeforeBip.addContainer.click();
    }
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(4);
    await pages.transportBeforeBip.removeContainer('PP-CONT-2').click();
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(3);
    await pages.transportBeforeBip.saveAndContinue.click();
    expect((await plantProductsApi.load(created.referenceNumber)).transport?.containers).toEqual([
      { containerNumber: 'PP-CONT-1', sealNumber: 'PP-SEAL-1', officialSeal: true },
      { containerNumber: 'PP-CONT-3', sealNumber: 'PP-SEAL-3', officialSeal: false },
    ]);

    await pages.transportBeforeBip.open(created.referenceNumber, false);
    await pages.transportBeforeBip.usesContainers(false).check();
    await expect(pages.transportBeforeBip.containerNumber).toBeHidden();
    await pages.transportBeforeBip.saveAndContinue.click();
    const persisted = (await plantProductsApi.load(created.referenceNumber)).transport;
    expect(persisted?.usesContainers).toBe(false);
    expect(persisted?.containers).toBeNull();

    await pages.transportBeforeBip.open(created.referenceNumber, false);
    await expect(pages.transportBeforeBip.containerRows).toHaveCount(0);
  },
);
