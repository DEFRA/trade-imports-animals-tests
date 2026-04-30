import type { PageObjects } from '@page-objects';

export class AdminJourneys {
  constructor(private readonly pages: PageObjects) {}

  async toAdminDashboard(): Promise<void> {
    await this.pages.adminDashboard.open();
  }

  async toNotifications(): Promise<void> {
    await this.toAdminDashboard();
    await this.pages.adminDashboard.btnNotifications.click();
  }
}
