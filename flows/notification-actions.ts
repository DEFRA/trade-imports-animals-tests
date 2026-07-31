import type { PageObjects } from '@page-objects';

export class NotificationActions {
  constructor(private readonly pages: PageObjects) {}

  async toNotificationView(journeyId: string): Promise<void> {
    await this.pages.notificationView.open(journeyId);
  }

  async amendNotification(journeyId: string): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.amend(journeyId).click();
    await this.pages.overview.heading.waitFor();
  }

  async deleteNotification(journeyId: string): Promise<void> {
    await this.pages.notificationDashboard.open();
    await this.pages.notificationDashboard.searchFor(journeyId);
    await this.pages.notificationDashboard.delete(journeyId).click();
    await this.pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
    await this.pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
    await this.pages.page.getByText('The notification has been deleted.').waitFor();
  }
}
