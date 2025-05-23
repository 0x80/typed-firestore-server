import type {
  DocumentData,
  DocumentSnapshot,
  PartialWithFieldValue,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import type {
  FsMutableDocument,
  FsMutableDocumentInTransaction,
} from "~/types";

export function makeMutableDocument<
  TNarrowOrFull extends DocumentData,
  TFull extends DocumentData = TNarrowOrFull,
>(
  doc: DocumentSnapshot<TNarrowOrFull>
): FsMutableDocument<TNarrowOrFull, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => doc.ref.update(data),
    updateWithPartial: (data: PartialWithFieldValue<TFull>) =>
      doc.ref.update(data as UpdateData<TFull>),
    delete: () => doc.ref.delete(),
  };
}

export function makeMutableDocumentInTransaction<
  TNarrowOrFull extends DocumentData,
  TFull extends DocumentData = TNarrowOrFull,
>(
  tx: Transaction,
  doc: DocumentSnapshot<TNarrowOrFull>
): FsMutableDocumentInTransaction<TNarrowOrFull, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => tx.update(doc.ref, data),
    updateWithPartial: (data: PartialWithFieldValue<TFull>) =>
      tx.update(doc.ref, data as UpdateData<TFull>),
    delete: () => tx.delete(doc.ref),
  };
}
