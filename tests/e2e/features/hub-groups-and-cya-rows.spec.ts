import type { Locator } from '@playwright/test';
import { test, expect } from '@fixtures';
import { ARRIVAL_DATE } from '@flows/journey';

test.describe('Hub groups and check-your-answers rows', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the hub groups its tasks under the six numbered group headings', async ({ journey, pages }) => {
    await journey.startNotification();

    await expect(pages.page.getByRole('heading', { level: 2 })).toContainText([
      '1. About the consignment',
      '2. Commodity details',
      '3. Movement',
      '4. Addresses',
      '5. Documents',
      '6. Check and submit',
    ]);

    // One task list per group, in the same order as the headings. Conditional
    // rows (exit details, transit countries) are not owed on a fresh
    // notification, so only the always-present tasks are pinned per group.
    const taskLists = pages.page.locator('ul.app-task-list');
    await expect(taskLists).toHaveCount(6);
    const expectListedTasks = async (list: Locator, tasks: string[]) => {
      for (const task of tasks) await expect(list).toContainText(task);
    };
    await expectListedTasks(taskLists.nth(0), [
      'Where is this consignment coming from?',
      'What are you importing?',
      'Main reason for importing',
    ]);
    await expectListedTasks(taskLists.nth(1), ['Additional commodity details', 'Animal identification details']);
    await expectListedTasks(taskLists.nth(2), ['Arrival details', 'Transporter']);
    await expectListedTasks(taskLists.nth(3), ['Roles and addresses', 'Contact address']);
    await expectListedTasks(taskLists.nth(4), ['Uploaded documents']);
    await expectListedTasks(taskLists.nth(5), ['Check and submit']);
  });

  test('after completing every section the check-your-answers page renders the answered rows', async ({ journey, pages }) => {
    test.slow();
    await journey.toReview();

    const value = (card: Locator, key: string) =>
      card.locator('.govuk-summary-list__row', { has: pages.page.getByText(key, { exact: true }) }).locator('.govuk-summary-list__value');

    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '1. About the consignment' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '2. Movement' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 2, name: '3. Addresses' })).toBeVisible();
    // No documents were uploaded, so the documents section does not render.
    await expect(pages.page.getByRole('heading', { level: 2, name: '4. Documents' })).toHaveCount(0);

    await expect(pages.page.getByRole('heading', { level: 3, name: 'Consignment details' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 3, name: 'Commodity details' })).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 3, name: 'Species' })).toBeVisible();

    const importDetails = pages.notificationView.summaryCard('Import details');
    await expect(value(importDetails, 'Country of origin')).toHaveText('France');
    await expect(value(importDetails, 'Region of origin code required')).toHaveText('Yes');
    await expect(value(importDetails, 'Region of origin code')).toHaveText('FR-75');
    await expect(value(importDetails, 'Internal reference number')).toHaveText('Imports456GB');

    const additionalAnimalDetails = pages.notificationView.summaryCard('Additional animal details');
    await expect(value(additionalAnimalDetails, 'Certified for')).toHaveText('Slaughter');
    await expect(value(additionalAnimalDetails, 'Includes unweaned animals')).toHaveText('No');
    await expect(value(additionalAnimalDetails, 'Reason for import')).toHaveText('Internal market');
    await expect(value(additionalAnimalDetails, 'Purpose in the market')).toHaveText('Breeding');

    const speciesCard = pages.notificationView.summaryCard('Cow (0102) — Bos taurus');
    await expect(value(speciesCard, 'Commodity code')).toHaveText('0102');
    await expect(value(speciesCard, 'Common name')).toHaveText('Cow');
    await expect(value(speciesCard, 'Species')).toHaveText('Bos taurus');
    await expect(value(speciesCard, 'Number of animals')).toHaveText('1');
    await expect(value(speciesCard, 'Number of packages')).toHaveText('5');
    await expect(speciesCard.getByRole('heading', { name: 'Animal details' })).toBeVisible();
    await expect(speciesCard.getByRole('columnheader', { name: 'Ear tag' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'Animal 1' })).toBeVisible();
    await expect(speciesCard.getByRole('cell', { name: 'UK123456789012' })).toBeVisible();

    const arrivalDetails = pages.notificationView.summaryCard('Arrival details');
    await expect(value(arrivalDetails, 'Port of entry')).toHaveText('Aberdeen Harbour (GB ABD)');
    await expect(value(arrivalDetails, 'Arrival date at port of entry')).toHaveText(ARRIVAL_DATE);
    await expect(value(arrivalDetails, 'Means of transport')).toHaveText('Road Vehicle');
    await expect(value(arrivalDetails, 'Countries that the consignment will travel through')).toHaveText('Belgium, France');
    await expect(value(arrivalDetails, 'Transport identification')).toHaveText('FR-892-LK');
    await expect(value(arrivalDetails, 'Transport document reference')).toHaveText('CMR-2026-884721');

    const transportDetails = pages.notificationView.summaryCard('Transport details');
    await expect(value(transportDetails, 'Name')).toContainText('García Livestock Transport SL');
    await expect(value(transportDetails, 'Type')).toHaveText('Commercial');

    const rolesAndAddresses = pages.notificationView.summaryCard('Roles and addresses');
    await expect(value(rolesAndAddresses, 'Place of origin')).toContainText('Origin Farm');
    await expect(value(rolesAndAddresses, 'Consignor')).toContainText('Astra Rosales');
    await expect(value(rolesAndAddresses, 'Consignee')).toContainText('British Livestock Ltd');
    await expect(value(rolesAndAddresses, 'Importer')).toContainText('Import Co UK');
    await expect(value(rolesAndAddresses, 'Place of destination')).toContainText('Tech Imports Ltd');
    // The CYA renders the CPH normalised (separators stripped), not as typed.
    await expect(value(rolesAndAddresses, 'County Parish Holding number (CPH)')).toHaveText('123456789');

    const contactAddress = pages.notificationView.summaryCard('Contact address for this consignment');
    await expect(value(contactAddress, 'Address')).toContainText('Animal and Plant Health Agency');
  });
});
