import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { FsDocument } from "~/types";

export function makeDocument<T extends Record<string, unknown>>(
  doc: DocumentSnapshot<T>
): FsDocument<T> {
  return {
    id: doc.id,
    data: doc.data()!,
  };
}
