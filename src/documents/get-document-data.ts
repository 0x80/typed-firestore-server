import type {
  CollectionReference,
  Transaction,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";
import { invariant } from "~/utils";

export async function getDocumentData<T extends UnknownObject>(
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await ref.doc(documentId).get();

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return doc.data()!;
}

export async function getDocumentDataMaybe<T extends UnknownObject>(
  ref: CollectionReference<T>,
  documentId?: string | null
) {
  if (!documentId) return;

  const doc = await ref.doc(documentId).get();

  if (!doc.exists) return;

  return doc.data()!;
}

export async function getDocumentDataInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: CollectionReference<T>,
  documentId: string
) {
  const doc = await tx.get(ref.doc(documentId));

  invariant(doc.exists, `No document available at ${ref.path}/${documentId}`);

  return doc.data()!;
}

export async function getDocumentDataInTransactionMaybe<
  T extends UnknownObject,
>(tx: Transaction, ref: CollectionReference<T>, documentId?: string | null) {
  if (!documentId) return;

  const doc = await tx.get(ref.doc(documentId));

  if (!doc.exists) {
    return;
  }

  return doc.data()!;
}
