import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { FsData, FsMutableDocument } from "~/types";
import { DEFAULT_BATCH_SIZE } from "../constants";
import { getSomeDocuments } from "./get-some-documents";

/** This gets the documents in batches, overriding any limit set on the query */
export async function getDocumentsBatched<
  T extends FsData,
  TFull extends FsData,
>(query: Query): Promise<FsMutableDocument<T, TFull>[]> {
  const documents: FsMutableDocument<T, TFull>[] = [];
  let lastDocumentSnapshot: QueryDocumentSnapshot<T> | undefined;

  do {
    const [chunk, _lastDocumentSnapshot] = await getSomeDocuments<T, TFull>(
      query,
      lastDocumentSnapshot,
      DEFAULT_BATCH_SIZE
    );

    documents.push(...chunk);
    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (lastDocumentSnapshot);

  return documents;
}
