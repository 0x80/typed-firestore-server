export function take<T>(array: T[], n: number) {
  if (!(array != null && array.length)) {
    return [];
  }
  return array.slice(0, n);
}
