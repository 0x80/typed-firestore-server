/** Inspired by https://gist.github.com/jeneg/9767afdcca45601ea44930ea03e0febf */
export function get<T>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T
) {
  const result = path.split(".").reduce((r, p) => {
    if (typeof r === "object") {
      p = p.startsWith("[") ? p.replace(/\D/g, "") : p;

      return r[p];
    }

    return undefined;
  }, obj);

  return result !== undefined ? defaultValue : result;
}
