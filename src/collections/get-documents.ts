import type {
  CollectionGroup,
  CollectionReference,
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
import { buildQuery, getDocumentsChunked } from "./helpers";
import type { QueryBuilder, SelectedDocument } from "./types";

export type GetDocumentsOptions<
  T extends FsData,
  S extends (keyof T)[] | undefined = undefined,
> = {
  select?: S;
  chunkSize?: number;
};

export async function getDocuments<
  T extends FsData,
  S extends (keyof T)[] | undefined = undefined,
>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  options: GetDocumentsOptions<T, S> = {}
): Promise<FsMutableDocument<SelectedDocument<T, S>, T>[]> {
  const { query, disableBatching } = buildQuery(ref, queryFn, options.select);

  if (disableBatching) {
    const snapshot = await query.get();

    return snapshot.docs.map((doc) =>
      makeMutableDocument<SelectedDocument<T, S>, T>(
        doc as QueryDocumentSnapshot<SelectedDocument<T, S>>
      )
    );
  } else {
    return getDocumentsChunked<SelectedDocument<T, S>, T>(
      query,
      options.chunkSize
    );
  }
}

/**
 * Because transactions are limited to 500 operations, we do not use batching /
 * pagination here. here. You should limit the query if you expect the document
 * count to be close to the maximum.
 */
export async function getDocumentsInTransaction<
  T extends FsData,
  S extends (keyof T)[] | undefined = undefined,
>(
  tx: Transaction,
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  options: GetDocumentsOptions<T, S> = {}
): Promise<FsMutableDocumentInTransaction<SelectedDocument<T, S>, T>[]> {
  const { query } = buildQuery(ref, queryFn, options.select);

  const snapshot = await tx.get(query);

  if (snapshot.empty) return [];

  return snapshot.docs.map((doc) =>
    makeMutableDocumentInTransaction<SelectedDocument<T, S>, T>(
      doc as QueryDocumentSnapshot<SelectedDocument<T, S>>,
      tx
    )
  );
}
