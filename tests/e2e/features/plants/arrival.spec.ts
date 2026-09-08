import { test, expect } from '@fixtures';
import type { PlantsJourney } from '@flows/plants-journey';

const POTATOES = 'Potatoes (seed or ware)';
const PLANTS_FOR_PLANTING = 'Plants for planting';

const SEED_POTATOES = 'Seed potatoes';

const GERMANY = 'Germany';
const FRANCE = 'France';

const ARRIVAL_TASK_ROW = 'Arrival details';

const ALREADY_ARRIVED = 'Yes, it has already arrived';
const NOT_YET_ARRIVED = 'No, it has not arrived yet';

const ARRIVAL_STATUS_ERROR = 'Select whether the consignment has arrived';

// The window is four days (reg 26(1)), and the hint is the only place a trader
// reads it — so it is matched in full rather than on the number alone.
const POST_ARRIVAL_HINT =
  'You are making a post-arrival notification. It must be made no later than 4 days after the date of arrival. You will give the date it arrived and where it is now.';

const PRE_ARRIVAL_HINT =
  'You are making a pre-arrival notification. You will give the expected date of landing and the intended destination.';

const potatoLine = {
  Variety: 'Maris Piper',
  Quantity: '250',
  'Intended use': 'Planting',
};

const plantsLine = {
  Genus: 'Quercus (oak)',
  Species: 'Quercus robur',
  'Commodity code': '0602 20 20',
  Quantity: '120',
  'EPPO code': 'QUERO',
};

/** Reaches the arrival-status page on a plants-for-planting notification, the
 * shortest journey that is asked the question. */
const toArrivalStatus = async (plantsJourney: PlantsJourney): Promise<string> => {
  const reference = await plantsJourney.startNotification();
  await plantsJourney.chooseCommodityType(PLANTS_FOR_PLANTING);
  await plantsJourney.addCommodityLine(PLANTS_FOR_PLANTING, plantsLine);
  await plantsJourney.toOrigin();
  await plantsJourney.toArrivalStatus(GERMANY);
  return reference;
};

test.describe('High-risk plants arrival section', { tag: '@integration' }, () => {
  test('the arrival-status question offers both branches, and the post-arrival one quotes the window', async ({ pages, plantsJourney }) => {
    const reference = await toArrivalStatus(plantsJourney);

    await expect(pages.page).toHaveURL(pages.plantsArrivalStatus.expectedUrl(reference));
    await expect(pages.plantsArrivalStatus.heading).toBeVisible();
    await expect(pages.plantsArrivalStatus.arrivalStatus(ALREADY_ARRIVED)).not.toBeChecked();
    await expect(pages.plantsArrivalStatus.arrivalStatus(NOT_YET_ARRIVED)).not.toBeChecked();
    await expect(pages.plantsArrivalStatus.arrivalStatusHint(ALREADY_ARRIVED)).toHaveText(POST_ARRIVAL_HINT);
    await expect(pages.plantsArrivalStatus.arrivalStatusHint(NOT_YET_ARRIVED)).toHaveText(PRE_ARRIVAL_HINT);
  });

  test('the question must be answered before the notification moves on', async ({ pages, plantsJourney }) => {
    const reference = await toArrivalStatus(plantsJourney);

    await pages.plantsArrivalStatus.btnSaveAndContinue.click();

    await expect(pages.page).toHaveURL(pages.plantsArrivalStatus.expectedUrl(reference));
    await expect(pages.plantsArrivalStatus.errorSummary).toContainText(ARRIVAL_STATUS_ERROR);
  });

  test('the answer is saved, shown again on return, and completes the arrival task row', async ({ pages, plantsJourney }) => {
    const reference = await toArrivalStatus(plantsJourney);

    await pages.plantsArrivalStatus.arrivalStatus(ALREADY_ARRIVED).check();
    await pages.plantsArrivalStatus.btnSaveAndContinue.click();

    // Arrival-status is the last page of the journey built so far, so Continue
    // leaves for the Overview rather than another question.
    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.taskRow(ARRIVAL_TASK_ROW)).toContainText('Completed');

    await pages.plantsArrivalStatus.open(reference);
    await expect(pages.plantsArrivalStatus.arrivalStatus(ALREADY_ARRIVED)).toBeChecked();
  });

  test('a potato notification is never asked the question and its arrival row stays blocked', async ({ pages, plantsJourney }) => {
    const reference = await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
    await plantsJourney.toOrigin();

    await pages.plantsOrigin.selectCountry(FRANCE);
    await pages.plantsOrigin.btnSaveAndContinue.click();

    // Reg 24A gives the potato notification no post-arrival branch, so
    // `arrivalStatus` is out of scope: the opening run skips the step and the
    // hub's arrival row has no page a trader can open.
    await expect(pages.page).toHaveURL(pages.plantsOverview.expectedUrl(reference));
    await expect(pages.plantsOverview.taskRowByTitle(ARRIVAL_TASK_ROW)).toContainText('Cannot start yet');
    await expect(pages.plantsOverview.taskRowLink(ARRIVAL_TASK_ROW)).toHaveCount(0);
  });
});
