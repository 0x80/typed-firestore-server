import type { QueryOptions } from "./documents";

export const DEFAULT_BATCH_SIZE = 500;

export const optionsDefaults: Required<QueryOptions> = {
  disableBatching: false,
  batchSize: DEFAULT_BATCH_SIZE,
  limitToFirstBatch: false,
};
