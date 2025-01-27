import type {
  DocumentSnapshot,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsData, FsMutableDocument } from "~/types";

/**
 * Returns [documents, lastDocumentSnapshot], so that the last document snapshot
 * can be passed in as the "startAfter" argument.
 */
export async function getSomeDocuments<T extends FsData, TFull extends FsData>(
  query: Query,
  startAfterSnapshot: QueryDocumentSnapshot<T> | undefined,
  batchSize: number
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

  /**
   * Return undefined if this batch was smaller than the requested size, meaning
   * we've reached the end
   */
  const lastDocumentSnapshot =
    documents.length < batchSize ? undefined : snapshot.docs.at(-1);

  return [
    documents,
    lastDocumentSnapshot as QueryDocumentSnapshot<T> | undefined,
  ];
}
