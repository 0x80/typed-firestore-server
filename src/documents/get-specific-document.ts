import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import { invariant } from "~/utils";
import {
  makeMutableDocument,
  makeMutableDocumentTx,
} from "./make-mutable-document";

/**
 * When you have a collection with differently typed documents, you can define
 * document refs for each of them specifically
 */
export async function getSpecificDocument<T extends DocumentData>(
  ref: DocumentReference<T>
) {
  const doc = await ref.get();

  invariant(doc.exists, `No document available at ${ref.path}`);

  return makeMutableDocument<T>(doc);
}

export async function getSpecificDocumentMaybe<T extends DocumentData>(
  ref: DocumentReference<T>
) {
  const doc = await ref.get();

  if (!doc.exists) return;

  return makeMutableDocument<T>(doc);
}

export async function getSpecificDocumentTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>
) {
  const doc = await tx.get(ref);

  invariant(doc.exists, `No document available at ${ref.path}`);

  return makeMutableDocumentTx<T>(tx, doc);
}

export async function getSpecificDocumentMaybeTx<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>
) {
  const doc = await tx.get(ref);

  if (!doc.exists) return;

  return makeMutableDocumentTx<T>(tx, doc);
}

/** @deprecated Use getSpecificDocumentTx */
export async function getSpecificDocumentInTransaction<T extends DocumentData>(
  tx: Transaction,
  ref: DocumentReference<T>
) {
  return getSpecificDocumentTx(tx, ref);
}

/** @deprecated Use getSpecificDocumentMaybeTx */
export async function getSpecificDocumentInTransactionMaybe<
  T extends DocumentData,
>(tx: Transaction, ref: DocumentReference<T>) {
  return getSpecificDocumentMaybeTx(tx, ref);
}
