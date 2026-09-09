import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

/**
 * The consignor or exporter, picked from the organisation's address book.
 *
 * It is the last step of the opening run, so the destination page continues
 * here rather than to the Overview — which is all the destination spec needs of
 * it today. The locators the consignor's own spec will want come with that spec.
 */
export class PlantsConsignorSelectPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'consignors/select');
  }
}
