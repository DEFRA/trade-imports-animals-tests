import type { PageObjects } from '@page-objects';

/**
 * Operations on an existing notification's view page, reached directly by
 * reference number rather than by walking the creation wizard. Use
 * `Journey` instead for anything that progresses through wizard pages.
 */
export class NotificationActions {
  constructor(private readonly pages: PageObjects) {}

  async toNotificationView(referenceNumber: string): Promise<void> {
    await this.pages.notificationView.open(referenceNumber);
  }

  async amendNotification(referenceNumber: string): Promise<void> {
    await this.pages.notificationView.open(referenceNumber);
    await Promise.all([
      this.pages.page.waitForURL(new RegExp(this.pages.notificationView.expectedUrl(referenceNumber)), {
        waitUntil: 'commit',
      }),
      this.pages.notificationView.btnAmend.click(),
    ]);
    await this.pages.notificationView.amendStatusTag.waitFor();
  }

  async deleteNotification(referenceNumber: string): Promise<void> {
    await this.pages.notificationView.open(referenceNumber);
    await this.pages.notificationView.btnDelete.click();
    await this.pages.notificationView.btnConfirmDelete.click();
    await this.pages.notificationView.successBanner.waitFor({ state: 'visible' });
  }
}
