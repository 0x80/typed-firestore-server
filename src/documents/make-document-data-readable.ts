import { Timestamp } from "firebase-admin/firestore";
import { isPlainObject } from "~/utils";

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type JsonObject = {
  [key: string]: JsonValue;
};

/**
 * Make a firestore document more human readable when exporting to json. Useful
 * for debugging purposes.
 *
 * - Converts all Timestamps to strings
 * - Sorts object keys alphabetically
 */
export function makeDocumentDataReadable(
  documentData: FirebaseFirestore.DocumentData
) {
  return sortObjectKeysRecursive(convertTimestampsRecursive(documentData));
}

function convertTimestampsRecursive(data: JsonObject) {
  const convertedData = { ...data };

  for (const [key, value] of Object.entries(convertedData)) {
    if (value instanceof Timestamp) {
      convertedData[key] = `(timestamp) ${value.toDate().toISOString()}`;
    } else if (isPlainObject(value)) {
      convertedData[key] = convertTimestampsRecursive(value as JsonObject);
    }
  }

  return convertedData;
}

function sortObjectKeys<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  );
}

function sortObjectKeysRecursive<T extends Record<string, unknown>>(obj: T) {
  const sortedObj = sortObjectKeys(obj);

  for (const [key, value] of Object.entries(sortedObj)) {
    if (isPlainObject(value)) {
      sortedObj[key] = sortObjectKeysRecursive(value as JsonObject);
    }
  }

  return sortedObj;
}
