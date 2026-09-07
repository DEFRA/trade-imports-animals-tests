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
   * Creates a notification and lands on commodity-type, the opening run's first
   * step: the create POST begins the run and redirects there, not to the
   * Overview. The POST mints the reference, so the journey id in the landing URL
   * is the reference number — the records adapter marshals `referenceNumber`
   * straight onto `journeyId`.
   */
  async startNotification(): Promise<string> {
    await this.toDashboard();
    await this.pages.plantsDashboard.btnStartNewNotification.click();
    await this.pages.plantsCommodityType.heading.waitFor();
    const journeyId = this.pages.plantsCommodityType.journeyIdFromUrl();
    this.context.journeyId = journeyId;
    this.context.referenceNumber = journeyId;
    return journeyId;
  }

  /**
   * Leaves the entry page for the Overview by its Cancel control, which saves
   * nothing — so a spec that wants the hub reaches it with the notification
   * exactly as the create POST left it.
   */
  async toOverview(): Promise<void> {
    await this.pages.plantsCommodityType.linkCancel.click();
    await this.pages.plantsOverview.heading.waitFor();
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
