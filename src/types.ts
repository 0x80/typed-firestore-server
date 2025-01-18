import type {
  DocumentReference,
  Transaction,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";

/**
 * A simple serialize-able document type. Use this when defining functions that
 * take a document but do not need to mutate it.
 */
export type FsDocument<T> = Readonly<{
  id: string;
  data: T;
}>;

export type FsMutableDocument<T> = Readonly<{
  ref: DocumentReference<T>;
  update: (data: UpdateData<T>) => Promise<WriteResult>;
  /**
   * The Firestore `UpdateData` type which allows the use of FieldValue
   * sometimes does not accept perfectly valid data. This is an alternative
   * without FieldValue.
   */
  updatePartial: (data: Partial<T>) => Promise<WriteResult>;
}> &
  FsDocument<T>;

export type FsMutableDocumentFromTransaction<T> = Readonly<{
  ref: DocumentReference<T>;
  update: (data: UpdateData<T>) => Transaction;
  /**
   * The Firestore `UpdateData` type which allows the use of FieldValue
   * sometimes does not accept perfectly valid data. This is an alternative
   * without FieldValue.
   */
  updatePartial: (data: Partial<T>) => Transaction;
}> &
  FsDocument<T>;
