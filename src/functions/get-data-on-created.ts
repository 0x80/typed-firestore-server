import type {
  CollectionReference,
  DocumentReference,
} from "firebase-admin/firestore";
import type {
  FirestoreEvent,
  QueryDocumentSnapshot,
} from "firebase-functions/firestore";
import type { FsData } from "~/types";
import { invariant } from "~/utils";

export function getDataOnCreated<T extends FsData>(
  _ref: CollectionReference<T> | DocumentReference<T>,
  event: FirestoreEvent<QueryDocumentSnapshot | undefined>
): Readonly<T> {
  /**
   * Seems like a bug in cloud functions types, because how can it be undefined
   * if it was created?
   */
  invariant(event.data, "event.data is required");
  return event.data.data() as T;
}
