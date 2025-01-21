import {
  CollectionReference,
  type DocumentReference,
  type Transaction,
  type WithFieldValue,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/** Create or overwrite a document. */
export async function setDocument<T extends UnknownObject>(
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>
) {
  const docRef = ref.doc(documentId);

  await docRef.set(data);
}

export function setDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>
) {
  const docRef = ref.doc(documentId);

  tx.set(docRef, data);
}

/**
 * Create or overwrite a document in a collection where each document is typed
 * separately.
 */
export async function setSpecificDocument<T extends UnknownObject>(
  ref: DocumentReference<T>,
  data: WithFieldValue<T>
) {
  await ref.set(data);
}

export function setSpecificDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: WithFieldValue<T>
) {
  tx.set(ref, data);
}
