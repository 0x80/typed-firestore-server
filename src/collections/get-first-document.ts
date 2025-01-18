import type {
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";
import type { SelectedDocument } from "./types";

export function getFirstDocument<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(collectionRef: CollectionReference<T>) {
  return async <S extends K[] | undefined = undefined>(
    queryFn: (collection: CollectionReference) => Query,
    options: { select?: S } = {}
  ): Promise<FsMutableDocument<SelectedDocument<T, K, S>> | undefined> => {
    const finalQuery = options.select
      ? queryFn(collectionRef).select(...(options.select as string[]))
      : queryFn(collectionRef);

    const snapshot = await finalQuery.limit(1).get();

    if (snapshot.empty) {
      return;
    }

    return makeMutableDocument(
      snapshot.docs[0] as QueryDocumentSnapshot<SelectedDocument<T, K, S>>
    );
  };
}
