import type {
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument, UnknownObject } from "~/types";

/**
 * Returns [documents, lastDocumentSnapshot], so that the last document snapshot
 * can be passed in as the "startAfter" argument.
 */
export async function getSomeDocuments<
  T extends UnknownObject,
  TFull extends UnknownObject,
>(
  query: Query,
  startAfterSnapshot: QueryDocumentSnapshot<T> | undefined,
  batchSize: number,
  limitToFirstBatch?: boolean
): Promise<
  [FsMutableDocument<T, TFull>[], QueryDocumentSnapshot<T> | undefined]
> {
  const limitedQuery = query.limit(batchSize);

  const pagedQuery = startAfterSnapshot
    ? limitedQuery.startAfter(startAfterSnapshot)
    : limitedQuery;

  const snapshot = await pagedQuery.get();

  if (snapshot.empty) {
    return [[], undefined];
  }

  const documents = snapshot.docs.map((doc) =>
    makeMutableDocument<T, TFull>(doc as DocumentSnapshot<T>)
  );

  /** Do not return the last snapshot if this batch was the last batch */
  const lastDocumentSnapshot =
    documents.length === batchSize ? snapshot.docs.at(-1) : undefined;

  return [
    documents,
    limitToFirstBatch
      ? undefined
      : (lastDocumentSnapshot as QueryDocumentSnapshot<T> | undefined),
  ];
}
