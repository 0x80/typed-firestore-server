import type {
  DocumentReference,
  UpdateData,
  WriteResult,
} from "firebase-admin/firestore";

/**
 * A simple serialize-able document type. All methods return an FsDocument, but
 * sometimes you might want to construct a document from an API payload, or be
 * able to serialize it. For those cases the PlainDocument type can be useful as
 * a subset of FsDocument, by dropping the `ref` property.
 */
export type FsDocument<T> = {
  readonly id: string;
  readonly data: T;
};

export type FsMutableDocument<T> = {
  readonly ref: DocumentReference<T>;
  readonly update: (data: UpdateData<T>) => Promise<WriteResult>;
} & FsDocument<T>;
