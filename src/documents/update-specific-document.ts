import {
  type DocumentData,
  type DocumentReference,
  type PartialWithFieldValue,
  type Transaction,
  type UpdateData,
} from "firebase-admin/firestore";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updateWithPartial` methods.
 */
export async function updateSpecificDocument<T extends DocumentData>(
  ref: DocumentReference<T>,
  data: UpdateData<T>
) {
  await ref.update(data);
}

export async function updateSpecificDocumentWithPartial<T extends DocumentData>(
  ref: DocumentReference<T>,
  data: PartialWithFieldValue<T>
) {
  await ref.update(data as UpdateData<T>);
}

export function updateSpecificDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: UpdateData<T>
) {
  tx.update(ref, data);
}

export function updateSpecificDocumentPartialTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: PartialWithFieldValue<T>
) {
  tx.update(ref, data as UpdateData<T>);
}

/** @deprecated Use updateSpecificDocumentTx */
export function updateSpecificDocumentInTransaction<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: UpdateData<T>
) {
  updateSpecificDocumentTx(tx, ref, data);
}

/** @deprecated Use updateSpecificDocumentPartialTx */
export function updateSpecificDocumentWithPartialInTransaction<
  T extends DocumentData,
>(tx: Transaction, ref: DocumentReference<T>, data: PartialWithFieldValue<T>) {
  updateSpecificDocumentPartialTx(tx, ref, data);
}
