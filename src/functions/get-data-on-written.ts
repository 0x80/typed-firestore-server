import type { Change } from "firebase-functions";
import type {
  DocumentSnapshot,
  FirestoreEvent,
} from "firebase-functions/firestore";

export function getDataOnWritten<T>(
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>
): Readonly<T> | undefined {
  return event.data?.after.data() as T | undefined;
}
