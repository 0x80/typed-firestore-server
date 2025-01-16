import type { DocumentSnapshot, UpdateData } from "firebase-admin/firestore";
import type { FsMutableDocument } from "~/types";

export function makeMutableDocument<T extends Record<string, unknown>>(
  doc: DocumentSnapshot<T>
): FsMutableDocument<T> {
  return {
    id: doc.id,
    data: doc.data() as T,
    ref: doc.ref,
    update: (data: UpdateData<T>) => doc.ref.update(data),
  };
}
