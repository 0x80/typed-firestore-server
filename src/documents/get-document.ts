import type {
  CollectionReference,
  Transaction,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";
import { invariant } from "~/utils";
import {
  makeMutableDocument,
  makeMutableDocumentInTransaction,
} from "./make-mutable-document";

export async function getDocument<T extends UnknownObject>(
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

export async function getDocumentMaybe<T extends UnknownObject>(
  collectionRef: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await collectionRef.doc(documentId).get();

  if (!doc.exists) return;

  return makeMutableDocument<T>(doc);
}

export async function getDocumentInTransaction<T extends UnknownObject>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  documentId: string
) {
  const doc = await transaction.get(collectionRef.doc(documentId));

  invariant(
    doc.exists,
    `No document available at ${collectionRef.path}/${documentId}`
  );

  return makeMutableDocumentInTransaction<T>(doc, transaction);
}

export async function getDocumentInTransactionMaybe<T extends UnknownObject>(
  transaction: Transaction,
  collectionRef: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await transaction.get(collectionRef.doc(documentId));

  if (!doc.exists) {
    return;
  }

  return makeMutableDocumentInTransaction<T>(doc, transaction);
}
