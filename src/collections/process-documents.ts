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
import { DEFAULT_CHUNK_SIZE } from "./constants";
import { getDocuments } from "./get-documents";
import { buildQuery, getSomeDocuments } from "./helpers";
import type { QueryBuilder, SelectedDocument } from "./types";

type ProcessDocumentsOptions<
  T extends FsData,
  S extends (keyof T)[] | undefined = undefined,
> = {
  select?: S;
  chunkSize?: number;
  throttleSeconds?: number;
};

/**
 * Process a collection using a query. If the query is null, the entire
 * collection is retrieved. An optional select statement can narrow the data.
 */
export async function processDocuments<
  T extends FsData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn: QueryBuilder | null,
  handler: (
    document: FsMutableDocument<SelectedDocument<T, S>, T>
  ) => Promise<unknown>,
  options: ProcessDocumentsOptions<T, S> = {}
) {
  const { query, disableBatching } = buildQuery(ref, queryFn, options.select);

  const { throttleSeconds = 0, chunkSize = DEFAULT_CHUNK_SIZE } = options;

  const errors: { id: string; message: string }[] = [];

  if (disableBatching) {
    const documents = await getDocuments(ref, queryFn, options);

    await processInChunks(
      documents,
      async (doc) => {
        try {
          await handler(doc);
        } catch (err) {
          errors.push({ id: doc.id, message: getErrorMessage(err) });
        }
      },
      { throttleSeconds, chunkSize }
    );
  } else {
    let lastDocumentSnapshot:
      | QueryDocumentSnapshot<SelectedDocument<T, S>>
      | undefined;
    let count = 0;

    do {
      verboseCount("Processing chunk");

      const [documents, _lastDocumentSnapshot] = await getSomeDocuments(
        query,
        lastDocumentSnapshot,
        chunkSize
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
        { throttleSeconds, chunkSize }
      );

      count += documents.length;
      lastDocumentSnapshot = _lastDocumentSnapshot;
    } while (isDefined(lastDocumentSnapshot));

    verboseLog(`Processed ${String(count)} documents`);

    if (errors.length > 0) {
      errors.forEach(({ id, message }) => {
        console.error(`${id}: ${message}`);
      });
    }
  }
}

/**
 * Process a collection using a query, and handle the results per chunk. If the
 * query is null, the entire collection is retrieved. An optional select
 * statement can narrow the data.
 */
export async function processDocumentsByChunk<
  T extends FsData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn:
    | ((collection: CollectionReference | CollectionGroup) => Query)
    | null,
  handler: (
    documents: FsMutableDocument<SelectedDocument<T, S>, T>[]
  ) => Promise<unknown>,
  options: ProcessDocumentsOptions<T, S> = {}
) {
  const { query, disableBatching } = buildQuery(ref, queryFn, options.select);

  const { throttleSeconds = 0, chunkSize = DEFAULT_CHUNK_SIZE } = options;

  const errors: string[] = [];

  if (disableBatching) {
    const documents = await getDocuments(ref, queryFn, options);

    try {
      await processInChunksByChunk(
        documents,
        async (docs) => {
          await handler(docs);
        },
        { throttleSeconds, chunkSize }
      );
    } catch (err) {
      errors.push(getErrorMessage(err));
    }
  } else {
    let lastDocumentSnapshot:
      | QueryDocumentSnapshot<SelectedDocument<T, S>>
      | undefined;
    let count = 0;

    do {
      verboseCount("Processing chunk");

      const [documents, _lastDocumentSnapshot] = await getSomeDocuments(
        query,
        lastDocumentSnapshot,
        chunkSize
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
          { throttleSeconds, chunkSize }
        );
      } catch (err) {
        errors.push(getErrorMessage(err));
      }

      count += documents.length;
      lastDocumentSnapshot = _lastDocumentSnapshot;
    } while (isDefined(lastDocumentSnapshot));

    verboseLog(`Processed ${String(count)} documents`);

    if (errors.length > 0) {
      errors.forEach((message) => {
        console.error(message);
      });
    }
  }
}
