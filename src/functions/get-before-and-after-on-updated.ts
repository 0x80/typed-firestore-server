import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { Change } from "firebase-functions";
import type { FirestoreEvent } from "firebase-functions/firestore";
import {
  getEventDataAfter,
  getEventDataBefore,
} from "./helpers/get-event-data";

export function getBeforeAndAfterOnUpdated<T>(
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined>
): readonly [T | undefined, T | undefined] {
  return [getEventDataBefore<T>(event), getEventDataAfter<T>(event)] as const;
}
