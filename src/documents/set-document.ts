import {
  CollectionReference,
  type SetOptions,
  type Transaction,
  type WithFieldValue,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/** Create or overwrite a document. */
export async function setDocument<T extends UnknownObject>(
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
  options: SetOptions = {}
) {
  const docRef = ref.doc(documentId);

  await docRef.set(data, options);
}

export function setDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>,
  options: SetOptions = {}
) {
  const docRef = ref.doc(documentId);

  tx.set(docRef, data, options);
}
