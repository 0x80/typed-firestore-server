import {
  CollectionReference,
  type WithFieldValue,
} from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/** Create or overwrite a document. */
export async function setDocument<T extends UnknownObject>(
  collectionRef: CollectionReference<T>,
  documentId: string,
  data: WithFieldValue<T>
) {
  const docRef = collectionRef.doc(documentId);

  await docRef.set(data);
}
