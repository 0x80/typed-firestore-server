import {
  CollectionReference,
  type SetOptions,
  type Transaction,
  type WithFieldValue,
} from "firebase-admin/firestore";
import type { FsData } from "~/types";

/** Create or overwrite a document. */
export async function setDocument<T extends FsData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
  options: SetOptions = {}
) {
  await ref.doc(documentId).set(data, options);
}

export function setDocumentInTransaction<T extends FsData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
  options: SetOptions = {}
) {
  tx.set(ref.doc(documentId), data, options);
}
