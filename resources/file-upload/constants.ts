import { DECIMAL_BYTES_PER_MB } from '@utils/synthetic-file-writer';

export const TEN_MB_BYTES = 10 * DECIMAL_BYTES_PER_MB;

// EUDPA-106 AC5 target: prove uploads at 50 MB succeed via the new /upload-and-scan flow.
export const FIFTY_MB_BYTES = 50 * DECIMAL_BYTES_PER_MB;

/**
 * Above the Hapi route payload cap (10 MB file cap + 1024 B multipart headroom) but below the
 * 10 MiB (10,485,760 B) CDP nginx ingress cap, so Hapi's Boom 413 rejection — and the
 * onPreResponse re-render — fires deterministically in both Compose and CDP.
 */
export const ABOVE_PAYLOAD_CAP_BYTES = 10_200_000;

export const OVERSIZE_FILE_MESSAGE = 'The selected file must be smaller than 10 MB';
