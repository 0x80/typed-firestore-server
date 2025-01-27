import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { FsData, FsMutableDocument } from "~/types";
import { DEFAULT_CHUNK_SIZE } from "../constants";
import { getSomeDocuments } from "./get-some-documents";

/** This gets the documents in batches, overriding any limit set on the query */
export async function getDocumentsChunked<
  T extends FsData,
  TFull extends FsData,
>(
  query: Query,
  chunkSize = DEFAULT_CHUNK_SIZE
): Promise<FsMutableDocument<T, TFull>[]> {
  const documents: FsMutableDocument<T, TFull>[] = [];
  let lastDocumentSnapshot: QueryDocumentSnapshot<T> | undefined;

  do {
    const [chunk, _lastDocumentSnapshot] = await getSomeDocuments<T, TFull>(
      query,
      lastDocumentSnapshot,
      chunkSize
    );

    documents.push(...chunk);
    lastDocumentSnapshot = _lastDocumentSnapshot;
  } while (lastDocumentSnapshot);

  return documents;
}
