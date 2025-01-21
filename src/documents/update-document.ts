import {
  CollectionReference,
  type Transaction,
  type UpdateData,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updateWithPartial` methods.
 */
export async function updateDocument<T extends UnknownObject>(
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>
) {
  const docRef = ref.doc(documentId);

  await docRef.update(data);
}

export async function updateDocumentWithPartial<T extends UnknownObject>(
  ref: CollectionReference<T>,
  documentId: string,
  data: Partial<T>
) {
  const docRef = ref.doc(documentId);

  await docRef.update(data);
}

export function updateDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>
) {
  const docRef = ref.doc(documentId);

  tx.update(docRef, data);
}

export function updateDocumentWithPartialInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: Partial<T>
) {
  const docRef = ref.doc(documentId);

  tx.update(docRef, data as UpdateData<T>);
}
