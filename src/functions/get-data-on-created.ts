import type { CollectionReference } from "firebase-admin/firestore";
import type {
  FirestoreEvent,
  QueryDocumentSnapshot,
} from "firebase-functions/firestore";
import type { FsData } from "~/types";
import { invariant } from "~/utils";

export function getDataOnCreated<T extends FsData>(
  _collectionRef: CollectionReference<T>,
  event: FirestoreEvent<QueryDocumentSnapshot | undefined>
): Readonly<T> {
  invariant(event.data, "event.data is required");
  return event.data.data() as T;
}
