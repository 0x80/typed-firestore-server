import type {
  FirestoreEvent,
  QueryDocumentSnapshot,
} from "firebase-functions/firestore";
import type { UnknownObject } from "~/types";
import { invariant } from "~/utils";

export function getDataOnCreated<T extends UnknownObject>(
  event: FirestoreEvent<QueryDocumentSnapshot | undefined>
): Readonly<T> {
  invariant(event.data, "event.data is required");
  return event.data.data() as T;
}
