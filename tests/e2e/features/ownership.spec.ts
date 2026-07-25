import { test, expect } from '@fixtures';
import { RestClientError } from '@adapters/http/rest-client';

test.describe('Fulfilment ownership', { tag: ['@compose', '@integration'] }, () => {
  test('returns 404 for a different Defra ID subject or organisation', async ({ notificationApi }) => {
    const fulfilment = await notificationApi.createFulfilment();

    for (const owner of [
      { id: 'different-subject', organisation: notificationApi.owner.organisation },
      { id: notificationApi.owner.id, organisation: 'different-organisation' },
    ]) {
      await expect(notificationApi.getFulfilment(fulfilment.id, owner)).rejects.toMatchObject({
        status: 404,
      } satisfies Partial<RestClientError>);
    }
  });
});
