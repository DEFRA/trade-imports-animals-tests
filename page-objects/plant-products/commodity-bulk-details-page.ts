import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export type CommodityBulkDetails = {
  numberOfPackages: string;
  packageType: string;
  quantity: string;
  quantityType: string;
  netWeight: string;
  controlledAtmosphereContainer: boolean;
  finishedOrPropagated?: 'FINISHED' | 'PROPAGATED';
  intendedForFinalUsers: boolean;
  testAndTrial: boolean;
};

export class CommodityBulkDetailsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodity-bulk-details', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity details' });
  }

  context(code: string, description: string): string {
    return `${code} ${description}`;
  }

  line(code: string, description: string): Locator {
    return this.page.getByRole('group', { name: this.context(code, description) });
  }

  field(code: string, description: string, label: string): Locator {
    return this.page.getByLabel(`${label} for ${this.context(code, description)}`, { exact: true });
  }

  option(code: string, description: string, legend: string, option: string): Locator {
    return this.page.getByLabel(`${option} — ${legend} for ${this.context(code, description)}`, { exact: true });
  }

  async fill(code: string, description: string, values: CommodityBulkDetails): Promise<void> {
    await this.field(code, description, 'Number of packages').fill(values.numberOfPackages);
    await this.field(code, description, 'Type of package').selectOption(values.packageType);
    await this.field(code, description, 'Quantity').fill(values.quantity);
    await this.field(code, description, 'Quantity type').selectOption(values.quantityType);
    await this.field(code, description, 'Net weight (kg)').fill(values.netWeight);
    await this.option(code, description, 'Controlled atmosphere container', values.controlledAtmosphereContainer ? 'Yes' : 'No').check();
    if (values.finishedOrPropagated) {
      await this.field(
        code,
        description,
        values.finishedOrPropagated === 'FINISHED' ? 'Finished product for final users' : 'To be grown on or propagated',
      ).check();
    }
    await this.option(code, description, 'Is the commodity intended for final users?', values.intendedForFinalUsers ? 'Yes' : 'No').check();
    if (values.testAndTrial) await this.field(code, description, 'For test and trial').check();
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }
}
