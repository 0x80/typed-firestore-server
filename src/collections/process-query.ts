import type {
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { FsMutableDocument } from "~/types";
import {
  getErrorMessage,
  isDefined,
  isEmpty,
  makeWait,
  verboseCount,
  verboseLog,
} from "~/utils";
import { DEFAULT_BATCH_SIZE } from "./constants";
import { getSomeDocuments } from "./helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ACTUAL_ANY = any;

type ProcessQueryOptions<T extends ACTUAL_ANY> = {
  query: Query<T>;
  handler: (document: FsMutableDocument<T>) => Promise<unknown>;
  select?: (keyof T)[];
  batchSize?: number;
  limitToFirstBatch?: boolean;
  throttleSecs?: number;
};

type ProcessQueryByChunkOptions<T extends ACTUAL_ANY> = {
  query: Query<T>;
  handler: (documents: FsMutableDocument<T>[]) => Promise<unknown>;
  select?: (keyof T)[];
  batchSize?: number;
  limitToFirstBatch?: boolean;
  throttleSecs?: number;
};

export async function processQuery<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  options: ProcessQueryOptions<T>
) {
  const {
    throttleSecs = 0,
    limitToFirstBatch = false,
    batchSize = DEFAULT_BATCH_SIZE,
  } = options;

  let lastDocumentSnapshot: QueryDocumentSnapshot | undefined;
  let count = 0;

  const errors: { id: string; message: string }[] = [];

  do {
    verboseCount("Processing chunk");

    const [documents, _lastDocumentSnapshot] = await getSomeDocuments<T>(
      options.query,
      lastDocumentSnapshot,
      batchSize,
      limitToFirstBatch
    );

    await Promise.all([
      ...documents.map((doc) =>
        options.handler(doc).catch((err) => {
          errors.push({ id: doc.id, message: getErrorMessage(err) });
        })
      ),
      makeWait(throttleSecs),
    ]);

    count += documents.length;

    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (isDefined(lastDocumentSnapshot) && !limitToFirstBatch);

  verboseLog(`Processed ${count} documents`);

  if (errors.length > 0) {
    errors.forEach(({ id, message }) => {
      console.error(`${id}: ${message}`);
    });
  }
}

export async function processQueryByChunk<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  options: ProcessQueryByChunkOptions<T>
) {
  const {
    throttleSecs = 0,
    limitToFirstBatch = false,
    batchSize = DEFAULT_BATCH_SIZE,
  } = options;

  let lastDocumentSnapshot: QueryDocumentSnapshot | undefined;
  let count = 0;

  const errors: string[] = [];

  do {
    verboseCount("Processing chunk");

    const [documents, _lastDocumentSnapshot] = await getSomeDocuments<T>(
      options.query,
      lastDocumentSnapshot,
      batchSize,
      limitToFirstBatch
    );

    if (isEmpty(documents)) {
      continue;
    }

    await Promise.all([
      options
        .handler(documents)
        .catch((err) => errors.push(getErrorMessage(err))),
      makeWait(throttleSecs),
    ]);

    count += documents.length;

    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (isDefined(lastDocumentSnapshot) && !limitToFirstBatch);

  verboseLog("Processed", count);

  if (errors.length > 0) {
    errors.forEach((message) => {
      console.error(message);
    });
  }
}
