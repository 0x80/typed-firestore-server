import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";
import { invariant } from "~/utils";
import {
  makeMutableDocument,
  makeMutableDocumentInTransaction,
} from "./make-mutable-document";

/**
 * When you have a collection with differently typed documents, you can define
 * document refs for each of them specifically
 */
export async function getSpecificDocument<T extends UnknownObject>(
  documentRef: DocumentReference<T>
) {
  const doc = await documentRef.get();

  invariant(doc.exists, `No document available at ${documentRef.path}`);

  return makeMutableDocument<T>(doc);
}

export async function getSpecificDocumentInTransaction<T extends UnknownObject>(
  transaction: Transaction,
  documentRef: DocumentReference<T>
) {
  const doc = await transaction.get(documentRef);

  invariant(doc.exists, `No document available at ${documentRef.path}`);

  return makeMutableDocumentInTransaction<T>(doc, transaction);
}
