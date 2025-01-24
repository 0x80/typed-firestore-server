import type {
  CollectionGroup,
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import {
  makeMutableDocument,
  makeMutableDocumentInTransaction,
} from "~/documents";
import type {
  FsData,
  FsMutableDocument,
  FsMutableDocumentInTransaction,
} from "~/types";
import { DEFAULT_BATCH_SIZE } from "./constants";
import { getDocumentsBatch } from "./helpers";
import type { SelectedDocument } from "./types";

export type GetDocumentsOptions<
  T extends FsData,
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
  T extends FsData,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?:
    | ((collection: CollectionReference | CollectionGroup) => Query)
    | null,
  options: GetDocumentsOptions<T, K, S> = {}
): Promise<FsMutableDocument<SelectedDocument<T, K, S>, T>[]> {
  const {
    disableBatching = false,
    batchSize = DEFAULT_BATCH_SIZE,
    limitToFirstBatch = false,
  } = options;

  const finalQuery = queryFn
    ? options.select
      ? queryFn(ref).select(...(options.select as string[]))
      : queryFn(ref)
    : ref;

  if (disableBatching) {
    return (async () => {
      const snapshot = await finalQuery.get();
      return snapshot.docs.map((doc) =>
        makeMutableDocument<SelectedDocument<T, K, S>, T>(
          doc as QueryDocumentSnapshot<SelectedDocument<T, K, S>>
        )
      );
    })();
  } else {
    const limitedQuery = finalQuery.limit(batchSize);
    return getDocumentsBatch<SelectedDocument<T, K, S>, T>(limitedQuery, {
      limitToFirstBatch,
    });
  }
}

/**
 * Because transactions are limited to 500 operations, we do not use batching /
 * pagination here. here. You should limit the query if you expect the document
 * count to be close to the maximum.
 */
export async function getDocumentsInTransaction<
  T extends FsData,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  tx: Transaction,
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?:
    | ((collection: CollectionReference | CollectionGroup) => Query)
    | null,
  options: { select?: S } = {}
): Promise<FsMutableDocumentInTransaction<SelectedDocument<T, K, S>, T>[]> {
  const finalQuery = queryFn
    ? options.select
      ? queryFn(ref).select(...(options.select as string[]))
      : queryFn(ref)
    : ref;

  const snapshot = await tx.get(finalQuery);
  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) =>
    makeMutableDocumentInTransaction<SelectedDocument<T, K, S>, T>(
      doc as QueryDocumentSnapshot<SelectedDocument<T, K, S>>,
      tx
    )
  );
}
