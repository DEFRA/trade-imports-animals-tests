import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';

/**
 * The tests repo must not know the frontend's obligation model.
 *
 * Seeding used to POST a fulfilments payload straight to the backend, which
 * meant carrying thirty obligation UUIDs and the persisted-entry shapes in
 * here — a copy of the frontend's model that had to be recaptured every time
 * the journey moved, and silently went stale when it wasn't. Seeding now posts
 * to the frontend's own pages and lets it derive all of that.
 *
 * An obligation id is a UUID, and nothing this repo legitimately holds is one,
 * so a UUID anywhere in the source is the tell that the old approach is back.
 */
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const SKIPPED_DIRS = new Set([
  'node_modules',
  '.git',
  'test-results',
  'playwright-report',
  'allure-results',
  'allure-report',
  'blob-report',
]);

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        return SKIPPED_DIRS.has(entry.name) ? [] : sourceFiles(path);
      }
      return entry.name.endsWith('.ts') ? [path] : [];
    }),
  );
  return found.flat();
}

test.describe('Repository guards', { tag: '@guard' }, () => {
  test('holds no obligation ids, so seeding cannot go back to duplicating the frontend model', async () => {
    const root = resolve(import.meta.dirname, '../..');
    const files = await sourceFiles(root);
    const offenders = [];

    for (const file of files) {
      // This spec names the pattern it forbids, so it would report itself.
      if (file === import.meta.filename) continue;
      const contents = await readFile(file, 'utf8');
      if (UUID.test(contents)) {
        offenders.push(file.replace(`${root}/`, ''));
      }
    }

    expect(offenders, 'Seed notifications by posting to the frontend, which owns the obligation model.').toEqual([]);
  });
});
