import type {
  CollectionReference,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import type { FsMutableDocument } from "~/types";
import {
  getErrorMessage,
  isDefined,
  isEmpty,
  makeWait,
  verboseCount,
  verboseLog,
} from "~/utils";
import { DEFAULT_BATCH_SIZE } from "./constants";
import { getSomeDocuments } from "./helpers";

type ProcessQueryOptions<T extends Record<string, unknown>> = {
  select?: (keyof T)[];
  batchSize?: number;
  limitToFirstBatch?: boolean;
  throttleSecs?: number;
};

type SelectedDocument<
  T,
  K extends keyof T,
  S extends K[] | undefined,
> = S extends K[] ? Pick<T, S[number]> : T;

export function processQuery<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(collectionRef: CollectionReference<T>) {
  return async <S extends K[] | undefined = undefined>(
    queryFn: (collection: CollectionReference) => Query,
    handler: (
      document: FsMutableDocument<SelectedDocument<T, K, S>>
    ) => Promise<unknown>,
    options: ProcessQueryOptions<T> & { select?: S } = {}
  ) => {
    const {
      throttleSecs = 0,
      limitToFirstBatch = false,
      batchSize = DEFAULT_BATCH_SIZE,
    } = options;

    const query = options.select
      ? queryFn(collectionRef).select(...(options.select as string[]))
      : queryFn(collectionRef);

    let lastDocumentSnapshot:
      | QueryDocumentSnapshot<SelectedDocument<T, K, S>>
      | undefined;
    let count = 0;

    const errors: { id: string; message: string }[] = [];

    do {
      verboseCount("Processing chunk");

      const [documents, _lastDocumentSnapshot] = await getSomeDocuments(
        query,
        lastDocumentSnapshot,
        batchSize,
        limitToFirstBatch
      );

      await Promise.all([
        ...documents.map((doc) =>
          handler(doc as FsMutableDocument<SelectedDocument<T, K, S>>).catch(
            (err) => {
              errors.push({ id: doc.id, message: getErrorMessage(err) });
            }
          )
        ),
        makeWait(throttleSecs),
      ]);

      count += documents.length;

      lastDocumentSnapshot = _lastDocumentSnapshot;
    } while (isDefined(lastDocumentSnapshot) && !limitToFirstBatch);

    verboseLog(`Processed ${count} documents`);

    if (errors.length > 0) {
      errors.forEach(({ id, message }) => {
        console.error(`${id}: ${message}`);
      });
    }
  };
}

export function processQueryByChunk<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
>(collectionRef: CollectionReference<T>) {
  return async <S extends K[] | undefined = undefined>(
    queryFn: (collection: CollectionReference<T>) => Query<T>,
    handler: (
      documents: FsMutableDocument<SelectedDocument<T, K, S>>[]
    ) => Promise<unknown>,
    options: ProcessQueryOptions<T> & { select?: S } = {}
  ) => {
    const {
      throttleSecs = 0,
      limitToFirstBatch = false,
      batchSize = DEFAULT_BATCH_SIZE,
    } = options;

    const query = options.select
      ? (queryFn(collectionRef).select(
          ...(options.select as string[])
        ) as Query<S extends K[] ? Pick<T, S[number]> : T>)
      : (queryFn(collectionRef) as Query<T>);

    let lastDocumentSnapshot:
      | QueryDocumentSnapshot<SelectedDocument<T, K, S>>
      | undefined;
    let count = 0;

    const errors: string[] = [];

    do {
      verboseCount("Processing chunk");

      const [documents, _lastDocumentSnapshot] = await getSomeDocuments(
        query,
        lastDocumentSnapshot,
        batchSize,
        limitToFirstBatch
      );

      if (isEmpty(documents)) {
        continue;
      }

      await Promise.all([
        handler(documents).catch((err) => errors.push(getErrorMessage(err))),
        makeWait(throttleSecs),
      ]);

      count += documents.length;

      lastDocumentSnapshot = _lastDocumentSnapshot;
    } while (isDefined(lastDocumentSnapshot) && !limitToFirstBatch);

    verboseLog(`Processed ${count} documents`);

    if (errors.length > 0) {
      errors.forEach((message) => {
        console.error(message);
      });
    }
  };
}
