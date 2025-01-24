import {
  CollectionReference,
  type WithFieldValue,
} from "firebase-admin/firestore";
import type { FsData } from "~/types";

export async function addDocument<T extends FsData>(
  ref: CollectionReference<T>,
  data: WithFieldValue<T>
) {
  const docRef = await ref.add(data);

  return docRef.id;
}
