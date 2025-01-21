import type {
  DocumentReference,
  SetOptions,
  Transaction,
  WithFieldValue,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/**
 * Create or overwrite a document in a collection where each document is typed
 * separately.
 */
export async function setSpecificDocument<T extends UnknownObject>(
  ref: DocumentReference<T>,
  data: WithFieldValue<T>,
  options: SetOptions = {}
) {
  await ref.set(data, options);
}

export function setSpecificDocumentInTransaction<T extends UnknownObject>(
  tx: Transaction,
  ref: DocumentReference<T>,
  data: WithFieldValue<T>,
  options: SetOptions = {}
) {
  tx.set(ref, data, options);
}
