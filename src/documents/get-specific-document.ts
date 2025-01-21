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
  ref: DocumentReference<T>
) {
  const doc = await ref.get();

  invariant(doc.exists, `No document available at ${ref.path}`);

  return makeMutableDocument<T>(doc);
}

export async function getSpecificDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: DocumentReference<T>
) {
  const doc = await tx.get(ref);

  invariant(doc.exists, `No document available at ${ref.path}`);

  return makeMutableDocumentInTransaction<T>(doc, tx);
}
