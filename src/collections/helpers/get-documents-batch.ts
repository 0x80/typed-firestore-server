import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { FsMutableDocument } from "~/types";
import { DEFAULT_BATCH_SIZE } from "../constants";
import { getSomeDocuments } from "./get-some-documents";

export async function getDocumentsBatch<T extends Record<string, unknown>>(
  query: Query,
  options: { limitToFirstBatch?: boolean } = {}
): Promise<FsMutableDocument<T>[]> {
  const documents: FsMutableDocument<T>[] = [];
  let lastDocumentSnapshot: QueryDocumentSnapshot<T> | undefined;

  do {
    const [chunk, _lastDocumentSnapshot] = await getSomeDocuments(
      query,
      lastDocumentSnapshot,
      DEFAULT_BATCH_SIZE,
      options.limitToFirstBatch
    );

    documents.push(...(chunk as FsMutableDocument<T>[]));
    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (lastDocumentSnapshot);

  return documents;
}
