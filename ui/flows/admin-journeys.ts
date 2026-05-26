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

  async toOutboxEvents(referenceNumber?: string): Promise<void> {
    await this.toAdminDashboard();
    await this.pages.adminDashboard.btnOutboxEvents.click();
    if (referenceNumber) {
      await this.pages.adminOutboxEvents.inputReferenceNumber.fill(referenceNumber);
      await this.pages.adminOutboxEvents.btnSearch.click();
    }
  }
}
