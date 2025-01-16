import type { Query, QueryDocumentSnapshot } from "@google-cloud/firestore";
import { MAX_BATCH_SIZE } from "~/constants";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";
import { get, last, verboseLog } from "~/utils";

export async function getDocumentsBatch<T extends Record<string, unknown>>(
  query: Query<T>,
  options: {
    orderByField?: string;
    limitToFirstBatch?: boolean;
  }
): Promise<FsMutableDocument<T>[]> {
  const { orderByField, limitToFirstBatch } = options;

  /**
   * For easy testing we sometimes need to run an algorithm on only a part of a
   * collection (like cities). This boolean makes that easy but it should never
   * be used in production so we log it with a warning.
   */
  if (limitToFirstBatch) {
    console.warn(
      "Returning only the first batch of documents (limitToFirstBatch = true)"
    );
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    return [];
  }

  const lastDoc = last(snapshot.docs) as QueryDocumentSnapshot;

  /** Map the results to documents */
  const results = snapshot.docs.map(makeMutableDocument<T>);

  /** Log some information about count and pagination */
  const numRead = snapshot.size;
  const lastPageLog = orderByField && get(lastDoc.data(), orderByField);

  verboseLog(`Read ${numRead} records, until ${lastPageLog ?? lastDoc.id}`);

  if (numRead < MAX_BATCH_SIZE || limitToFirstBatch === true) {
    return results;
  } else {
    const pagedQuery = query.startAfter(lastDoc);
    return results.concat(await getDocumentsBatch<T>(pagedQuery, options));
  }
}
