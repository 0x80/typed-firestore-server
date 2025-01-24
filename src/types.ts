import type {
  DocumentReference,
  FieldValue,
  Transaction,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";

export type FsData = Record<string, unknown>;

/** Makes each root property optional and allows FieldValue as a value */
export type PartialWithFieldValue<T> = {
  [P in keyof T]?: T[P] extends object ? T[P] : T[P] | FieldValue;
};

/**
 * A simple serialize-able document type. Use this when defining functions that
 * take a document but do not need to mutate it.
 */
export type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;

export type FsMutableDocument<TNarrowOrFull, TFull = TNarrowOrFull> = Readonly<{
  ref: DocumentReference;
  update: (data: UpdateData<TFull>) => Promise<WriteResult>;
  /**
   * The Firestore UpdateData<T> type can reject nested data that is perfectly
   * valid. In those cases you have this as an alternative based on Partial<T>
   * with FieldValue allowed for each root property.
   */
  updateWithPartial: (
    data: PartialWithFieldValue<TFull>
  ) => Promise<WriteResult>;
  delete: () => Promise<WriteResult>;
}> &
  FsDocument<TNarrowOrFull>;

export type FsMutableDocumentInTransaction<
  TNarrowOrFull,
  TFull = TNarrowOrFull,
> = Readonly<{
  ref: DocumentReference;
  update: (data: UpdateData<TFull>) => Transaction;
  /**
   * The Firestore UpdateData<T> type can reject nested data that is perfectly
   * valid. In those cases you have this as an alternative based on Partial<T>
   * with FieldValue allowed for each root property.
   */
  updateWithPartial: (data: PartialWithFieldValue<TFull>) => Transaction;
  delete: () => Transaction;
}> &
  FsDocument<TNarrowOrFull>;
