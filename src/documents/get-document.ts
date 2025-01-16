import type {
  CollectionReference,
  Transaction,
} from "firebase-admin/firestore";
import { invariant } from "~/utils";
import { makeMutableDocument } from "./make-mutable-document";

export async function getDocument<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  documentId: string
) {
  const doc = await collectionRef.doc(documentId).get();

  invariant(
    doc.exists,
    `No document available at ${collectionRef.path}/${documentId}`
  );

  return makeMutableDocument<T>(doc);
}

export async function getDocumentMaybe<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await collectionRef.doc(documentId).get();

  if (!doc.exists) return;

  return makeMutableDocument<T>(doc);
}

export async function getDocumentFromTransaction<
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

  return makeMutableDocument<T>(doc);
}

export async function getDocumentFromTransactionMaybe<
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

  return makeMutableDocument<T>(doc);
}
