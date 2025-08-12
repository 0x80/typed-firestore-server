import type {
  CollectionReference,
  DocumentData,
  Transaction,
} from "firebase-admin/firestore";
import { invariant } from "~/utils";
import {
  makeMutableDocument,
  makeMutableDocumentTx,
} from "./make-mutable-document";

export async function getDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await ref.doc(documentId).get();

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return makeMutableDocument<T>(doc);
}

export async function getDocumentMaybe<T extends DocumentData>(
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await ref.doc(documentId).get();

  if (!doc.exists) return;

  return makeMutableDocument<T>(doc);
}

export async function getDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await tx.get(ref.doc(documentId));

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return makeMutableDocumentTx<T>(tx, doc);
}

export async function getDocumentMaybeTx<T extends DocumentData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await tx.get(ref.doc(documentId));

  if (!doc.exists) {
    return;
  }

  return makeMutableDocumentTx<T>(tx, doc);
}
