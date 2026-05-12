import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type EicarWrittenFile = { filePath: string; fileName: string };

export const EICAR_DEFAULT_PDF_FILENAME = 'eicar-virus-file.pdf';

const EICAR_STANDARD_FILE_B64 = 'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=';

/**
 * Decodes the official 68-byte EICAR test file payload (stored as base64 to avoid the raw signature in source).
 *
 * @see https://www.eicar.org/download-anti-malware-testfile/
 */
export function eicarStandardFileBytes(): Buffer {
  return Buffer.from(EICAR_STANDARD_FILE_B64, 'base64');
}

/** Writes EICAR bytes to `outDir`/`fileName`. Returns {@link EicarWrittenFile} with `filePath` as the absolute path for Playwright `locator.setInputFiles(filePath)`; `fileName` is the same as the `fileName` argument. */
export async function writeEicarTestFile(outDir: string, fileName: string): Promise<EicarWrittenFile> {
  await mkdir(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);
  await writeFile(filePath, eicarStandardFileBytes());
  return { filePath, fileName };
}

/** Same as {@link writeEicarTestFile} with {@link EICAR_DEFAULT_PDF_FILENAME}. */
export async function writeEicarPdfFile(outDir: string): Promise<EicarWrittenFile> {
  return writeEicarTestFile(outDir, EICAR_DEFAULT_PDF_FILENAME);
}
