import type {
  CollectionGroup,
  CollectionReference,
} from "firebase-admin/firestore";
import type { FsData } from "~/types";
import { invariant, isDefined } from "~/utils";
import { MAX_QUERY_LIMIT } from "../constants";
import type { QueryBuilder } from "../types";
import { getQueryInfo } from "./get-query-info";

/** Validates the passed-in queryFn and apply options to build the final query */
export function buildQuery<T extends FsData>(
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

  const disableBatching = isDefined(limit);

  const query = queryFn
    ? optionsSelect
      ? queryFn(ref).select(...(optionsSelect as string[]))
      : queryFn(ref)
    : ref;

  return { query, disableBatching };
}
