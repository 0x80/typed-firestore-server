import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";
import { last } from "~/utils";

/**
 * Returns [documents, lastDocumentSnapshot], so that the last document snapshot
 * can be passed in as the "startAfter" argument.
 */
export async function getSomeDocuments<T extends Record<string, unknown>>(
  query: Query<T>,
  startAfterSnapshot: QueryDocumentSnapshot | undefined,
  batchSize: number,
  limitToFirstBatch?: boolean
): Promise<[FsMutableDocument<T>[], QueryDocumentSnapshot<T> | undefined]> {
  const limitedQuery = query.limit(batchSize);

  const pagedQuery = startAfterSnapshot
    ? limitedQuery.startAfter(startAfterSnapshot)
    : limitedQuery;

  const snapshot = await pagedQuery.get();

  if (snapshot.empty) {
    return [[], undefined];
  }

  const documents = snapshot.docs.map(makeMutableDocument<T>);

  /** Do not return the last snapshot if this batch was the last batch */
  const lastDocumentSnapshot =
    documents.length === batchSize ? last(snapshot.docs) : undefined;

  return [documents, limitToFirstBatch ? undefined : lastDocumentSnapshot];
}
