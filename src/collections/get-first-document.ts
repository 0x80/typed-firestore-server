import type {
  CollectionReference,
  DocumentSnapshot,
  Query,
} from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument, UnknownObject } from "~/types";
import type { SelectedDocument } from "./types";

export function getFirstDocument<
  T extends UnknownObject,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
>(
  collectionRef: CollectionReference<T>,
  queryFn: (collection: CollectionReference) => Query,
  options: { select?: S } = {}
): Promise<FsMutableDocument<SelectedDocument<T, K, S>, T> | undefined> {
  const finalQuery = options.select
    ? queryFn(collectionRef).select(...(options.select as string[]))
    : queryFn(collectionRef);

  return (async () => {
    const snapshot = await finalQuery.limit(1).get();

    if (snapshot.empty) {
      return;
    }

    return makeMutableDocument<SelectedDocument<T, K, S>, T>(
      snapshot.docs[0] as DocumentSnapshot<SelectedDocument<T, K, S>>
    );
  })();
}
