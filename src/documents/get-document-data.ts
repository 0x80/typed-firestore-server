import type {
  CollectionReference,
  DocumentData,
  Transaction,
} from "firebase-admin/firestore";
import { invariant } from "~/utils";

export async function getDocumentData<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await ref.doc(documentId).get();

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return doc.data()!;
}

export async function getDocumentDataMaybe<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await ref.doc(documentId).get();

  if (!doc.exists) return;

  return doc.data()!;
}

export async function getDocumentDataTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await tx.get(ref.doc(documentId));

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return doc.data()!;
}

export async function getDocumentDataTxMaybe<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await tx.get(ref.doc(documentId));

  if (!doc.exists) {
    return;
  }

  return doc.data()!;
}

/** @deprecated Use getDocumentDataTx */
export async function getDocumentDataInTransaction<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string
) {
  return getDocumentDataTx(tx, ref, documentId);
}

/** @deprecated Use getDocumentDataTxMaybe */
export async function getDocumentDataInTransactionMaybe<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  return getDocumentDataTxMaybe(tx, ref, documentId);
}
