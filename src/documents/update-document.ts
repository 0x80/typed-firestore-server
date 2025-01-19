import { CollectionReference, type UpdateData } from "firebase-admin/firestore";
import type { UnknownObject } from "~/types";

/**
 * Update a document in a collection. You would only use this if you do not
 * already have a handle to a FsMutableDocument, because that has typed `update`
 * and `updatePartial` methods.
 */
export async function updateDocument<T extends UnknownObject>(
  collectionRef: CollectionReference<T>,
  documentId: string,
  data: UpdateData<T>
) {
  const docRef = collectionRef.doc(documentId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Document does not exist at ${docRef.path}`);
  }

  await docRef.update(data);
}

/**
 * In some cases, where UpdateData<T> does not accept your data and you do not
 * need FieldValue you should be able to use this as a workaround.
 */
export async function updatePartialDocument<T extends UnknownObject>(
  collectionRef: CollectionReference<T>,
  documentId: string,
  data: Partial<T>
) {
  const docRef = collectionRef.doc(documentId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Document does not exist at ${docRef.path}`);
  }

  await docRef.update(data);
}
