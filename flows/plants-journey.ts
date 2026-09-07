import type { PageObjects } from '@page-objects';
import type { JourneyContext } from '@flows/journey';

export class PlantsJourney {
  constructor(
    private readonly pages: PageObjects,
    private readonly context: JourneyContext,
  ) {}

  async toDashboard(): Promise<void> {
    await this.pages.plantsDashboard.open();
    await this.pages.plantsDashboard.heading.waitFor();
  }

  /**
   * Creates a notification and lands on its Overview. The create POST mints the
   * reference, so the journey id in the landing URL is the reference number —
   * the records adapter marshals `referenceNumber` straight onto `journeyId`.
   */
  async startNotification(): Promise<string> {
    await this.toDashboard();
    await this.pages.plantsDashboard.btnStartNewNotification.click();
    await this.pages.plantsOverview.heading.waitFor();
    const journeyId = this.pages.plantsOverview.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }

  async returnToDashboard(): Promise<void> {
    await this.pages.plantsOverview.btnReturnToDashboard.click();
    await this.pages.plantsDashboard.heading.waitFor();
  }

  /**
   * From the dashboard card, opens the delete confirmation page for that reference.
   * The listing is paginated over every notification the backend holds, so the card
   * is reached by searching for the reference rather than by paging to find it.
   */
  async deleteFromDashboard(reference: string): Promise<void> {
    await this.pages.plantsDashboard.searchForReference(reference);
    await this.pages.plantsDashboard.delete(reference).click();
    await this.pages.plantsDeleteNotification.heading.waitFor();
  }
}
