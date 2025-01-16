export function verboseLog(...args: unknown[]) {
  if (process.env.VERBOSE) {
    console.log(...args);
  }
}

export function verboseCount(label: string) {
  if (process.env.VERBOSE) {
    console.count(label);
  }
}
