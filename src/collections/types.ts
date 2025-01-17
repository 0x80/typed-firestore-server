export type SelectedDocument<
  T,
  K extends keyof T,
  S extends K[] | undefined,
> = S extends K[] ? Pick<T, S[number]> : T;
