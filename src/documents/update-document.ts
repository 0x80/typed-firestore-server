import {
  CollectionReference,
  type PartialWithFieldValue,
  type Transaction,
  type UpdateData,
} from "firebase-admin/firestore";
import type { FsData } from "~/types";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updateWithPartial` methods.
 */
export async function updateDocument<T extends FsData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>
) {
  await ref.doc(documentId).update(data);
}

export async function updateDocumentWithPartial<T extends FsData>(
  ref: CollectionReference<T>,
  documentId: string,
  data: PartialWithFieldValue<T>
) {
  await ref.doc(documentId).update(data as UpdateData<T>);
}

export function updateDocumentInTransaction<T extends FsData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>
) {
  tx.update(ref.doc(documentId), data);
}

export function updateDocumentWithPartialInTransaction<T extends FsData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string,
  data: PartialWithFieldValue<T>
) {
  tx.update(ref.doc(documentId), data as UpdateData<T>);
}
