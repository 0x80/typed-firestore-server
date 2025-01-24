import type {
  DocumentSnapshot,
  FieldValue,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import type {
  FsData,
  FsMutableDocument,
  FsMutableDocumentInTransaction,
} from "~/types";

/** Makes each property in T optional and allows FieldValue as a value */
type PartialWithFieldValue<T> = {
  [P in keyof T]?: T[P] | FieldValue;
};

export function makeMutableDocument<
  TNarrowOrFull extends FsData,
  TFull extends FsData = TNarrowOrFull,
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
  TNarrowOrFull extends FsData,
  TFull extends FsData = TNarrowOrFull,
>(
  doc: DocumentSnapshot<TNarrowOrFull>,
  tx: Transaction
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
