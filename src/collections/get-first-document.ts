import type { Query } from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";

/**
 * Because getDocuments overwrites any query limit with the batchSize, this
 * function is useful for when you just want to get the first document from a
 * sorted query.
 *
 * Alternatively, you can use getDocuments with options `{ disableBatching: true
 * }`, which would preserve the limit you set on the query.
 */
export async function getFirstDocument<T extends Record<string, unknown>>(
  query: Query<T>
) {
  const snapshot = await query.limit(1).get();

  if (snapshot.empty) {
    return;
  }

  return makeMutableDocument<T>(snapshot.docs[0]!);
}
