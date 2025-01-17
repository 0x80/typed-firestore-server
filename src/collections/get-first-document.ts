import type {
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";

export function getFirstDocument<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(collectionRef: CollectionReference<T>) {
  return async <S extends K[] | undefined = undefined>(
    queryFn: (collection: CollectionReference<T>) => Query<T>,
    options: { select?: S } = {}
  ): Promise<
    FsMutableDocument<S extends K[] ? Pick<T, S[number]> : T> | undefined
  > => {
    const finalQuery = options.select
      ? (queryFn(collectionRef).select(
          ...(options.select as string[])
        ) as Query<Pick<T, K>>)
      : (queryFn(collectionRef) as Query<Pick<T, K>>);

    const snapshot = await finalQuery.limit(1).get();

    if (snapshot.empty) {
      return;
    }

    return makeMutableDocument<S extends K[] ? Pick<T, S[number]> : T>(
      snapshot.docs[0]! as QueryDocumentSnapshot<
        S extends K[] ? Pick<T, S[number]> : T
      >
    );
  };
}
