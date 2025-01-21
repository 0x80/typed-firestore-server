import type {
  DocumentSnapshot,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import type {
  FsMutableDocument,
  FsMutableDocumentInTransaction,
  UnknownObject,
} from "~/types";

export function makeMutableDocument<
  TNarrowOrFull extends UnknownObject,
  TFull extends UnknownObject = TNarrowOrFull,
>(
  doc: DocumentSnapshot<TNarrowOrFull>
): FsMutableDocument<TNarrowOrFull, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => doc.ref.update(data),
    updateWithPartial: (data: Partial<TFull>) => doc.ref.update(data),
  };
}

export function makeMutableDocumentInTransaction<
  TNarrowOrFull extends UnknownObject,
  TFull extends UnknownObject = TNarrowOrFull,
>(
  doc: DocumentSnapshot<TNarrowOrFull>,
  tx: Transaction
): FsMutableDocumentInTransaction<TNarrowOrFull, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => tx.update(doc.ref, data),
    updateWithPartial: (data: Partial<TFull>) =>
      tx.update(doc.ref, data as UpdateData<TFull>),
  };
}
