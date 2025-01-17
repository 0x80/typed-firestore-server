import type { Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
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
>(query: Query<T>) {
  return async <S extends K[] | undefined = undefined>(
    options: GetDocumentsOptions<T> & { select?: S } = {}
  ): Promise<FsMutableDocument<S extends K[] ? Pick<T, S[number]> : T>[]> => {
    const {
      disableBatching = false,
      batchSize = DEFAULT_BATCH_SIZE,
      limitToFirstBatch = false,
    } = options;

    const finalQuery = options.select
      ? (query.select(...(options.select as string[])) as Query<Pick<T, K>>)
      : (query as Query<Pick<T, K>>);

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
>(transaction: FirebaseFirestore.Transaction) {
  return async <S extends K[] | undefined = undefined>(
    query: FirebaseFirestore.Query<T>,
    options: { select?: S } = {}
  ) => {
    const finalQuery = options.select
      ? (query.select(
          ...(options.select as string[])
        ) as FirebaseFirestore.Query<Pick<T, K>>)
      : (query as FirebaseFirestore.Query<Pick<T, K>>);

    const snapshot = await transaction.get(finalQuery);
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) =>
      makeDocument<S extends K[] ? Pick<T, S[number]> : T>(
        doc as QueryDocumentSnapshot<S extends K[] ? Pick<T, S[number]> : T>
      )
    );
  };
}
