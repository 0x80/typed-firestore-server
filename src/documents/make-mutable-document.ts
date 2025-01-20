import type {
  DocumentSnapshot,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import type {
  FsMutableDocument,
  FsMutableDocumentFromTransaction,
  UnknownObject,
} from "~/types";

export function makeMutableDocument<
  T extends UnknownObject,
  TFull extends UnknownObject,
>(doc: DocumentSnapshot<T>): FsMutableDocument<T, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => doc.ref.update(data),
    updatePartial: (data: Partial<TFull>) => doc.ref.update(data),
  };
}

export function makeMutableDocumentFromTransaction<
  T extends UnknownObject,
  TFull extends UnknownObject,
>(
  doc: DocumentSnapshot<T>,
  transaction: Transaction
): FsMutableDocumentFromTransaction<T, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => transaction.update(doc.ref, data),
    updatePartial: (data: Partial<TFull>) =>
      transaction.update(doc.ref, data as UpdateData<TFull>),
  };
}
