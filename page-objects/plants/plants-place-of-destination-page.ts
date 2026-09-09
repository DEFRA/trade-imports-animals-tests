import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * Where the consignment is going, picked from the organisation's address book.
 *
 * The page asks one of three questions and the heading says which: potatoes and
 * a consignment still on its way are asked for the intended destination, and one
 * that has already arrived is asked where it is being kept now.
 */
export class PlantsPlaceOfDestinationPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'destinations/select');
  }

  headingNamed(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name, exact: true });
  }
}
