import type { PlantProductsPageObjects } from '@page-objects';

export class PlantProductsNotificationActions {
  constructor(private readonly pages: PlantProductsPageObjects) {}

  private async openDashboardRow(reference: string): Promise<void> {
    // API-seeded records are organisation-visible but are not in this browser session's known-journeys
    // cookie until they are loaded once. Dashboard POST actions deliberately require that cookie.
    await this.pages.notificationView.open(reference);
    await this.pages.plantNotificationDashboard.open(false);
    await this.pages.plantNotificationDashboard.searchForReference(reference);
    await this.pages.plantNotificationDashboard.row(reference).waitFor();
  }

  async view(reference: string): Promise<void> {
    await this.openDashboardRow(reference);
    await this.pages.plantNotificationDashboard.view(reference).click();
  }

  async amend(reference: string): Promise<void> {
    await this.openDashboardRow(reference);
    await this.pages.plantNotificationDashboard.amend(reference).click();
  }

  async cancelAmend(reference: string): Promise<void> {
    await this.openDashboardRow(reference);
    await this.pages.plantNotificationDashboard.cancelAmend(reference).click();
  }

  async copy(reference: string): Promise<void> {
    await this.openDashboardRow(reference);
    await this.pages.plantNotificationDashboard.copy(reference).click();
  }

  async delete(reference: string): Promise<void> {
    await this.openDashboardRow(reference);
    await this.pages.plantNotificationDashboard.delete(reference).click();
  }

  async cancelAmendFromView(): Promise<void> {
    await this.pages.notificationView.cancelAmend.click();
  }

  async copyFromView(): Promise<void> {
    await this.pages.notificationView.copy.click();
  }

  async deleteFromView(): Promise<void> {
    await this.pages.notificationView.delete.click();
  }

  async confirmCancelAmend(): Promise<void> {
    await this.pages.cancelAmend.confirm.click();
  }

  async keepAmend(): Promise<void> {
    await this.pages.cancelAmend.reject.click();
  }

  async confirmDelete(): Promise<void> {
    await this.pages.deleteConfirmation.confirm.click();
  }

  async keepNotification(): Promise<void> {
    await this.pages.deleteConfirmation.reject.click();
  }
}
