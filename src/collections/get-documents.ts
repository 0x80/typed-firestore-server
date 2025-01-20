import type {
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { makeDocument, makeMutableDocument } from "~/documents";
import type { FsDocument, FsMutableDocument, UnknownObject } from "~/types";
import { DEFAULT_BATCH_SIZE } from "./constants";
import { getDocumentsBatch } from "./helpers";
import type { SelectedDocument } from "./types";

export type GetDocumentsOptions<
  T extends UnknownObject,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
> = {
  select?: S;
  /**
   * Normally a limit clause on the query is ignored because of the batching
   * mechanism. By disabling batching you fetch whatever limit is set on the
   * query (or unlimited), all in one go. This would problematic for large
   * collections.
   */
  disableBatching?: boolean;
  batchSize?: number;
  limitToFirstBatch?: boolean;
};

export function getDocuments<
  T extends UnknownObject,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  collectionRef: CollectionReference<T>,
  queryFn?: ((collection: CollectionReference) => Query) | null,
  options: GetDocumentsOptions<T, K, S> = {}
): Promise<FsMutableDocument<SelectedDocument<T, K, S>>[]> {
  const {
    disableBatching: useQueryLimit = false,
    batchSize = DEFAULT_BATCH_SIZE,
    limitToFirstBatch = false,
  } = options;

  const finalQuery = queryFn
    ? options.select
      ? queryFn(collectionRef).select(...(options.select as string[]))
      : queryFn(collectionRef)
    : collectionRef;

  if (useQueryLimit) {
    return (async () => {
      const snapshot = await finalQuery.get();
      return snapshot.docs.map((doc) =>
        makeMutableDocument(
          doc as QueryDocumentSnapshot<SelectedDocument<T, K, S>>
        )
      );
    })();
  } else {
    const limitedQuery = finalQuery.limit(batchSize);
    return getDocumentsBatch<SelectedDocument<T, K, S>>(limitedQuery, {
      limitToFirstBatch,
    });
  }
}

export function getDocumentsFromTransaction<
  T extends UnknownObject,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  queryFn?: ((collection: CollectionReference) => Query) | null,
  options: { select?: S } = {}
): Promise<FsDocument<SelectedDocument<T, K, S>>[]> {
  const finalQuery = queryFn
    ? options.select
      ? queryFn(collectionRef).select(...(options.select as string[]))
      : queryFn(collectionRef)
    : collectionRef;

  return (async () => {
    const snapshot = await transaction.get(finalQuery);
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) =>
      makeDocument(doc as QueryDocumentSnapshot<SelectedDocument<T, K, S>>)
    );
  })();
}
