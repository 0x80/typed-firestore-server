import type { UnknownObject } from "~/types";

export function isPlainObject(value: unknown): value is UnknownObject {
  if (typeof value !== "object" || value === null) return false;

  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}
