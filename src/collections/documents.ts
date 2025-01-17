import type {
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
  Transaction,
} from "firebase-admin/firestore";
import { makeDocument, makeMutableDocument } from "~/documents";
import type { FsMutableDocument } from "~/types";
import { DEFAULT_BATCH_SIZE } from "./constants";
import { getDocumentsBatch } from "./helpers";

export type GetDocumentsOptions<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
  S extends K[] | undefined = undefined,
> = {
  select?: S;
  disableBatching?: boolean;
  batchSize?: number;
  limitToFirstBatch?: boolean;
};

export function getDocuments<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(collectionRef: CollectionReference<T>) {
  return async <S extends K[] | undefined = undefined>(
    queryFn: (collection: CollectionReference<T>) => Query<T>,
    options: Omit<GetDocumentsOptions<T>, "select"> & { select?: S } = {}
  ): Promise<FsMutableDocument<S extends K[] ? Pick<T, S[number]> : T>[]> => {
    const {
      disableBatching = false,
      batchSize = DEFAULT_BATCH_SIZE,
      limitToFirstBatch = false,
    } = options;

    const finalQuery = options.select
      ? (queryFn(collectionRef).select(
          ...(options.select as string[])
        ) as Query<Pick<T, K>>)
      : (queryFn(collectionRef) as Query<Pick<T, K>>);

    if (disableBatching) {
      return (await finalQuery.get()).docs.map((doc) =>
        makeMutableDocument<S extends K[] ? Pick<T, S[number]> : T>(
          doc as QueryDocumentSnapshot<S extends K[] ? Pick<T, S[number]> : T>
        )
      );
    } else {
      const limitedQuery = finalQuery.limit(batchSize);
      return getDocumentsBatch<S extends K[] ? Pick<T, S[number]> : T>(
        limitedQuery as Query<S extends K[] ? Pick<T, S[number]> : T>,
        { limitToFirstBatch }
      );
    }
  };
}

export function getDocumentsFromTransaction<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(transaction: Transaction, collectionRef: CollectionReference<T>) {
  return async <S extends K[] | undefined = undefined>(
    queryFn: (collection: CollectionReference<T>) => Query<T>,
    options: { select?: S } = {}
  ) => {
    const finalQuery = options.select
      ? (queryFn(collectionRef).select(
          ...(options.select as string[])
        ) as Query<Pick<T, K>>)
      : (queryFn(collectionRef) as Query<Pick<T, K>>);

    const snapshot = await transaction.get(finalQuery);
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) =>
      makeDocument<S extends K[] ? Pick<T, S[number]> : T>(
        doc as QueryDocumentSnapshot<S extends K[] ? Pick<T, S[number]> : T>
      )
    );
  };
}
