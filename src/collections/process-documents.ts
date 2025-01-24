import type {
  CollectionGroup,
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { processInChunks, processInChunksByChunk } from "process-in-chunks";
import type { FsData, FsMutableDocument } from "~/types";
import {
  getErrorMessage,
  isDefined,
  isEmpty,
  verboseCount,
  verboseLog,
} from "~/utils";
import { DEFAULT_BATCH_SIZE } from "./constants";
import { getSomeDocuments } from "./helpers";
import type { SelectedDocument } from "./types";

type ProcessDocumentsOptions<T extends FsData> = {
  select?: (keyof T)[];
  batchSize?: number;
  limitToFirstBatch?: boolean;
  throttleSeconds?: number;
};

/**
 * Process a collection using a query. If the query is null, the entire
 * collection is retrieved. An optional select statement can narrow the data.
 */
export async function processDocuments<
  T extends FsData,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn:
    | ((collection: CollectionReference | CollectionGroup) => Query)
    | null,
  handler: (
    document: FsMutableDocument<SelectedDocument<T, K, S>, T>
  ) => Promise<unknown>,
  options: ProcessDocumentsOptions<T> & { select?: S } = {}
) {
  const {
    throttleSeconds = 0,
    limitToFirstBatch = false,
    batchSize = DEFAULT_BATCH_SIZE,
  } = options;

  const query = queryFn
    ? options.select
      ? queryFn(ref).select(...(options.select as string[]))
      : queryFn(ref)
    : ref;

  let lastDocumentSnapshot:
    | QueryDocumentSnapshot<SelectedDocument<T, K, S>>
    | undefined;
  let count = 0;

  const errors: { id: string; message: string }[] = [];

  do {
    verboseCount("Processing chunk");

    const [documents, _lastDocumentSnapshot] = await getSomeDocuments(
      query,
      lastDocumentSnapshot,
      batchSize,
      limitToFirstBatch
    );

    await processInChunks(
      documents,
      async (doc) => {
        try {
          await handler(doc);
        } catch (err) {
          errors.push({ id: doc.id, message: getErrorMessage(err) });
        }
      },
      { throttleSeconds }
    );

    count += documents.length;
    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (isDefined(lastDocumentSnapshot) && !limitToFirstBatch);

  verboseLog(`Processed ${String(count)} documents`);

  if (errors.length > 0) {
    errors.forEach(({ id, message }) => {
      console.error(`${id}: ${message}`);
    });
  }
}

/**
 * Process a collection using a query, and handle the results per chunk. If the
 * query is null, the entire collection is retrieved. An optional select
 * statement can narrow the data.
 */
export async function processDocumentsByChunk<
  T extends FsData,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn:
    | ((collection: CollectionReference | CollectionGroup) => Query)
    | null,
  handler: (
    documents: FsMutableDocument<SelectedDocument<T, K, S>, T>[]
  ) => Promise<unknown>,
  options: ProcessDocumentsOptions<T> & { select?: S } = {}
) {
  const {
    throttleSeconds = 0,
    limitToFirstBatch = false,
    batchSize = DEFAULT_BATCH_SIZE,
  } = options;

  const query = queryFn
    ? options.select
      ? queryFn(ref).select(...(options.select as string[]))
      : queryFn(ref)
    : ref;

  let lastDocumentSnapshot:
    | QueryDocumentSnapshot<SelectedDocument<T, K, S>>
    | undefined;
  let count = 0;

  const errors: string[] = [];

  do {
    verboseCount("Processing chunk");

    const [documents, _lastDocumentSnapshot] = await getSomeDocuments(
      query,
      lastDocumentSnapshot,
      batchSize,
      limitToFirstBatch
    );

    if (isEmpty(documents)) {
      continue;
    }

    try {
      await processInChunksByChunk(
        documents,
        async (docs) => {
          await handler(docs);
        },
        { throttleSeconds }
      );
    } catch (err) {
      errors.push(getErrorMessage(err));
    }

    count += documents.length;
    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (isDefined(lastDocumentSnapshot) && !limitToFirstBatch);

  verboseLog(`Processed ${String(count)} documents`);

  if (errors.length > 0) {
    errors.forEach((message) => {
      console.error(message);
    });
  }
}
