import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import {
  getSpecificDocument,
  getSpecificDocumentMaybe,
} from "./get-specific-document";
import { makeMutableDocumentInTransaction } from "./make-mutable-document";

export async function getSpecificDocumentData<T extends DocumentData>(
  ref: DocumentReference<T>
) {
  const doc = await getSpecificDocument(ref);
  return doc.data;
}

export async function getSpecificDocumentDataMaybe<T extends DocumentData>(
  ref: DocumentReference<T>
) {
  const doc = await getSpecificDocumentMaybe(ref);
  return doc?.data;
}

export async function getSpecificDocumentDataInTransactionMaybe<
  T extends DocumentData,
>(tx: Transaction, ref: DocumentReference<T>) {
  const doc = await tx.get(ref);

  if (!doc.exists) return;

  return makeMutableDocumentInTransaction<T>(tx, doc);
}
