import { NotificationPage } from '@page-objects/base/base-page';

/**
 * The plants journey's notification pages share the animals URL shape
 * (`/notifications/{journeyId}[/slug]`) but sit on their own frontend, so the only
 * thing that differs is which base URL `open` navigates against.
 */
export class PlantsNotificationPage extends NotificationPage {
  protected async navigateToService(path: string): Promise<void> {
    await this.navigateToPlantsFrontend(path);
  }
}
