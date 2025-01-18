import type {
  DocumentSnapshot,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import type {
  FsMutableDocument,
  FsMutableDocumentFromTransaction,
} from "~/types";

export function makeMutableDocument<T extends Record<string, unknown>>(
  doc: DocumentSnapshot<T>
): FsMutableDocument<T> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<T>) => doc.ref.update(data),
    updateWithPartial: (data: Partial<T>) => doc.ref.update(data),
  };
}

export function makeMutableDocumentFromTransaction<
  T extends Record<string, unknown>,
>(
  doc: DocumentSnapshot<T>,
  transaction: Transaction
): FsMutableDocumentFromTransaction<T> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<T>) => transaction.update(doc.ref, data),
    updateWithPartial: (data: Partial<T>) =>
      transaction.update(doc.ref, data as UpdateData<T>),
  };
}
