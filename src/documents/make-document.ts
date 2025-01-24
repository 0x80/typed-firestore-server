import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { FsData, FsDocument } from "~/types";

export function makeDocument<T extends FsData>(
  doc: DocumentSnapshot<T>
): FsDocument<T> {
  return {
    id: doc.id,
    data: doc.data()!,
  };
}
