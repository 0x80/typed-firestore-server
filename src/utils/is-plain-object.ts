import type { FsData } from "~/types";

export function isPlainObject(value: unknown): value is FsData {
  if (typeof value !== "object" || value === null) return false;

  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}
