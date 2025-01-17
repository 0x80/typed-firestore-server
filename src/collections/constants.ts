import type { QueryOptions } from "./documents";

export const MAX_BATCH_SIZE = 500;
export const DEFAULT_CHUNK_SIZE = 500;

export const optionsDefaults: Required<QueryOptions> = {
  disableBatching: false,
  batchSize: MAX_BATCH_SIZE,
  limitToFirstBatch: false,
};
