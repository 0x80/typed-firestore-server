import type { Query } from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";
import { optionsDefaults } from "./constants";
import { getDocumentsBatch } from "./helpers";

export type QueryOptions = {
  disableBatching?: boolean;
  batchSize?: number;
  limitToFirstBatch?: boolean;
};

/**
 * Getting all documents from a collection becomes problematic once the
 * collection grows over 500. Requests might time out. This function differs
 * from the equally named function in the client app because there you would not
 * fetch this many documents at once without pagination.
 *
 * Options limitToFirstBatch is mainly used for backend scripts test runs where
 * you want to validate logic without having to fetch all documents of a
 * collection which can be painfully slow.
 *
 * Enable batching by default, because it is quite dangerous to forget it.
 * Firestore will not return an error if you're trying to fetch too many
 * documents but just return an incomplete snapshot.
 */
export async function getDocuments<T extends Record<string, unknown>>(
  query: Query<T>,
  options: QueryOptions = {}
): Promise<FsMutableDocument<T>[]> {
  const { disableBatching, batchSize, limitToFirstBatch } = Object.assign(
    {},
    optionsDefaults,
    options
  );

  if (disableBatching) {
    return (await query.get()).docs.map(makeMutableDocument<T>);
  } else {
    const limitedQuery = query.limit(batchSize);

    return getDocumentsBatch<T>(limitedQuery, {
      limitToFirstBatch,
    });
  }
}

export async function getDocumentsFromTransaction<
  T extends Record<string, unknown>,
>(
  transaction: FirebaseFirestore.Transaction,
  query: FirebaseFirestore.Query<T>
) {
  const snapshot = await transaction.get(query);

  if (snapshot.empty) return [];

  return snapshot.docs.map(makeMutableDocument<T>);
}

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
