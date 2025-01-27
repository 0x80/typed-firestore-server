import type {
  DocumentSnapshot,
  Transaction,
  UpdateData,
} from "firebase-admin/firestore";
import type {
  FsData,
  FsMutableDocument,
  FsMutableDocumentInTransaction,
  FsPartialWithFieldValue,
} from "~/types";

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
    updateWithPartial: (data: FsPartialWithFieldValue<TFull>) =>
      doc.ref.update(data as UpdateData<TFull>),
    delete: () => doc.ref.delete(),
  };
}

export function makeMutableDocumentInTransaction<
  TNarrowOrFull extends FsData,
  TFull extends FsData = TNarrowOrFull,
>(
  tx: Transaction,
  doc: DocumentSnapshot<TNarrowOrFull>
): FsMutableDocumentInTransaction<TNarrowOrFull, TFull> {
  return {
    id: doc.id,
    data: doc.data()!,
    ref: doc.ref,
    update: (data: UpdateData<TFull>) => tx.update(doc.ref, data),
    updateWithPartial: (data: FsPartialWithFieldValue<TFull>) =>
      tx.update(doc.ref, data as UpdateData<TFull>),
    delete: () => tx.delete(doc.ref),
  };
}
