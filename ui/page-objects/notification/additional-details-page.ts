import { Page, Locator } from '@playwright/test';
import type { YesNoValue } from '@domain/types/yes-no-values';

export class AdditionalDetailsPage {
  readonly expectedUrl = '/additional-details';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Additional animal details' });
  }

  get groupAnimalsCertifiedFor(): Locator {
    return this.page.getByRole('group', { name: 'What are the animals certified for?' });
  }

  get radioApprovedBodies(): Locator {
    return this.groupAnimalsCertifiedFor.getByRole('radio', { name: 'Approved bodies' });
  }

  get radioBreedingAndOrProduction(): Locator {
    return this.groupAnimalsCertifiedFor.getByRole('radio', { name: 'Breeding and/or production' });
  }

  get radioSlaughter(): Locator {
    return this.groupAnimalsCertifiedFor.getByRole('radio', { name: 'Slaughter' });
  }

  get groupUnweanedAnimals(): Locator {
    return this.page.getByRole('group', { name: 'Does the consignment contain any unweaned animals?' });
  }

  radioContainsUnweanedAnimals(value: YesNoValue): Locator {
    return this.groupUnweanedAnimals.getByRole('radio', { name: value });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
