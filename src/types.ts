import type {
  DocumentReference,
  FieldValue,
  Transaction,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";

export type UnknownObject = Record<string, unknown>;

/** Makes each property in T optional and allows FieldValue as a value */
export type PartialWithFieldValue<T> = {
  [P in keyof T]?: T[P] | FieldValue;
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
  /** Like Partial<T> but also accepts FieldValue for any property. */
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
  /** Like Partial<T> but also accepts FieldValue for any property. */
  updateWithPartial: (data: PartialWithFieldValue<TFull>) => Transaction;
  delete: () => Transaction;
}> &
  FsDocument<TNarrowOrFull>;
