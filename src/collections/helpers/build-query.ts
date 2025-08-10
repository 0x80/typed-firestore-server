import type {
  CollectionGroup,
  CollectionReference,
  DocumentData,
} from "firebase-admin/firestore";
import { invariant, isDefined } from "~/utils";
import { MAX_QUERY_LIMIT } from "../constants";
import type { QueryBuilder } from "../types";
import { getQueryInfo } from "./get-query-info";

/** Validates the passed-in queryFn and apply options to build the final query */
export function buildQuery<T extends DocumentData>(
  ref: CollectionReference<T> | CollectionGroup<T>,
  queryFn?: QueryBuilder | null,
  optionsSelect?: (keyof T)[]
) {
  const queryInfo = queryFn ? getQueryInfo(queryFn(ref)) : {};
  const { limit, select: querySelect } = queryInfo;

  invariant(
    !limit || limit <= MAX_QUERY_LIMIT,
    `Limit ${String(limit)} is greater than the maximum query limit of ${String(MAX_QUERY_LIMIT)}`
  );

  invariant(
    !querySelect,
    "Select is not allowed to be set on the query. Use the options instead."
  );

  const disableChunking = isDefined(limit);

  const baseQuery = queryFn ? queryFn(ref) : ref;

  const query = optionsSelect
    ? baseQuery.select(...(optionsSelect as string[]))
    : baseQuery;

  return { query, disableChunking, limit };
}
