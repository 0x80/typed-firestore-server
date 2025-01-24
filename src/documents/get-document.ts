import type {
  CollectionReference,
  Transaction,
} from "firebase-admin/firestore";
import type { FsData } from "~/types";
import { invariant } from "~/utils";
import {
  makeMutableDocument,
  makeMutableDocumentInTransaction,
} from "./make-mutable-document";

export async function getDocument<T extends FsData>(
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await ref.doc(documentId).get();

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return makeMutableDocument<T>(doc);
}

export async function getDocumentMaybe<T extends FsData>(
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await ref.doc(documentId).get();

  if (!doc.exists) return;

  return makeMutableDocument<T>(doc);
}

export async function getDocumentInTransaction<T extends FsData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await tx.get(ref.doc(documentId));

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return makeMutableDocumentInTransaction<T>(doc, tx);
}

export async function getDocumentInTransactionMaybe<T extends FsData>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await tx.get(ref.doc(documentId));

  if (!doc.exists) {
    return;
  }

  return makeMutableDocumentInTransaction<T>(doc, tx);
}
