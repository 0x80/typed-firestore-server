import type {
  CollectionReference,
  Transaction,
} from "firebase-admin/firestore";
import { invariant } from "~/utils";

export async function getDocumentData<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  documentId: string
) {
  const doc = await collectionRef.doc(documentId).get();

  invariant(
    doc.exists,
    `No document available at ${collectionRef.path}/${documentId}`
  );

  return doc.data()!;
}

export async function getDocumentDataMaybe<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await collectionRef.doc(documentId).get();

  if (!doc.exists) return;

  return doc.data()!;
}

export async function getDocumentDataFromTransaction<
  T extends Record<string, unknown>,
>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  documentId: string
) {
  const doc = await transaction.get(collectionRef.doc(documentId));

  invariant(
    doc.exists,
    `No document available at ${collectionRef.path}/${documentId}`
  );

  return doc.data()!;
}

export async function getDocumentDataFromTransactionMaybe<
  T extends Record<string, unknown>,
>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await transaction.get(collectionRef.doc(documentId));

  if (!doc.exists) {
    return;
  }

  return doc.data()!;
}
