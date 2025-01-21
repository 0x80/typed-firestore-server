import {
  CollectionReference,
  type DocumentReference,
  type Transaction,
  type WithFieldValue,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/** Create or overwrite a document. */
export async function setDocument<T extends UnknownObject>(
  collectionRef: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>
) {
  const docRef = collectionRef.doc(documentId);

  await docRef.set(data);
}

export function setDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  collectionRef: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>
) {
  const docRef = collectionRef.doc(documentId);

  tx.set(docRef, data);
}

/**
 * Create or overwrite a document in a collection where each document is typed
 * separately.
 */
export async function setSpecificDocument<T extends UnknownObject>(
  documentRef: DocumentReference<T>,
  data: WithFieldValue<T>
) {
  await documentRef.set(data);
}

export function setSpecificDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  documentRef: DocumentReference<T>,
  data: WithFieldValue<T>
) {
  tx.set(documentRef, data);
}
