import {
  CollectionReference,
  type DocumentData,
  type WithFieldValue,
} from "firebase-admin/firestore";

export async function addDocument<T extends DocumentData>(
  ref: CollectionReference<T>,
  data: WithFieldValue<T>
): Promise<string> {
  const docRef = await ref.add(data);

  return docRef.id;
}
