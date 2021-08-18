export function removeUnknownKeys<T extends object | { [key: string]: unknown }, K extends string[]>(
  obj: T | undefined,
  expectedKeys: K
) {
  return Object.keys(obj || {}).reduce((agg, key) => {
    if (expectedKeys.includes(key)) {
      agg[key] = (obj as Record<string, unknown>)[key]
    }
    return agg
  }, {} as Record<string, unknown>)
}
