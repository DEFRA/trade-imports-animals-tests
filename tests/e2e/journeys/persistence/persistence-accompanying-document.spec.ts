import { test, expect } from '@fixtures';
import { defaultJourneyOptions } from '@domain/constants/journey-options';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { documentTypes } from '@domain/constants/document-types';
import { type AccompanyingDocumentModel } from '@domain/models/db/accompanying-document';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { toUtcDate } from '@utils/date-utils';

test.describe('Accompanying document persistence', { tag: ['@compose', '@integration', '@mongodb'] }, () => {
  test('persists uploaded accompanying document', async ({ journey, journeyContext }) => {
    const options = {
      ...defaultJourneyOptions,
      accompanyingDocuments: {
        filePath: fileUploadPaths.safeFile250bPng,
        documentType: documentTypes.veterinaryHealthCertificate,
        documentReference: 'REFPERSIST',
        issueDate: {
          day: '02',
          month: '12',
          year: '2025',
        },
      },
    };

    // Addresses is the page directly after accompanying documents — saves the upload without submitting.
    await journey.toAddresses(options);
    const referenceNumber = journeyContext.notificationId;
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<AccompanyingDocumentModel>('trade-imports-animals-backend', 'accompanying_documents');
      await expect
        .poll(() => collection.countDocuments({ notificationReferenceNumber: referenceNumber }), { timeout: timeouts.short })
        .toBe(1);

      const docs = await collection.find({ notificationReferenceNumber: referenceNumber }).toArray();
      const [doc] = docs;
      const [file] = doc.files;

      expect(docs).toHaveLength(1);

      expect(String(doc._id)).toMatch(/^[a-f0-9]{24}$/i);
      expect(doc.version).toBe(1);
      expect(doc.notificationReferenceNumber).toBe(referenceNumber);
      expect(doc.uploadId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(doc.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(doc.documentType).toBe(options.accompanyingDocuments.documentType);
      expect(doc.documentReference).toBe(options.accompanyingDocuments.documentReference);
      const expectedDateOfIssue = toUtcDate(options.accompanyingDocuments.issueDate);
      expect(doc.dateOfIssue.getTime()).toBe(expectedDateOfIssue.getTime());
      expect(doc.scanStatus).toBe('COMPLETE');

      expect(doc.files).toHaveLength(1);
      expect(file.filename).toBe(fileUploadNames.safeFile250bPng);
      expect(file.contentType).toBe('image/png');
      expect(file.contentLength).toBe(250);
      expect(file.s3Key).toMatch(new RegExp(`^${referenceNumber}/${doc.uploadId}/`));
      expect(file.s3Bucket).toBe('trade-imports-animals-documents');
      expect(file.fileStatus).toBe('COMPLETE');
      expect(file.checksumSha256).toBeDefined();
      expect(file.detectedContentType).toBe('image/png');

      expect(doc.created).toBeInstanceOf(Date);
      expect(doc.updated).toBeInstanceOf(Date);
      expect(doc.updated.getTime()).toBeGreaterThanOrEqual(doc.created.getTime());
      expect(doc._class).toBe('uk.gov.defra.trade.imports.animals.accompanyingdocument.AccompanyingDocument');
    } finally {
      await client.close();
    }
  });
});
