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
export interface FsDocument<T> {
  readonly id: string;
  readonly data: T;
}

export type FsMutableDocument<T> = {
  readonly ref: DocumentReference<T>;
  readonly update: (data: UpdateData<T>) => Promise<WriteResult>;
  /**
   * The Firestore `UpdateData` type which allows the use of FieldValue
   * sometimes does not accept perfectly valid data. This is an alternative
   * without FieldValue.
   */
  readonly updateWithPartial: (data: Partial<T>) => Promise<WriteResult>;
} & FsDocument<T>;

export type FsMutableDocumentFromTransaction<T> = {
  readonly ref: DocumentReference<T>;
  readonly update: (data: UpdateData<T>) => Transaction;
  /**
   * The Firestore `UpdateData` type which allows the use of FieldValue
   * sometimes does not accept perfectly valid data. This is an alternative
   * without FieldValue.
   */
  readonly updateWithPartial: (data: Partial<T>) => Transaction;
} & FsDocument<T>;
