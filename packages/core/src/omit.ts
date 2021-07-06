/**
 * Lightweight alternative to lodash.omit. Faster, and way less code.
 */
export function omit<T extends object, K extends string[]>(obj: T, keys: K) {
  return Object.keys(obj).reduce((newObject, key) => {
    if (keys.indexOf(key) === -1) newObject[key] = (obj as Record<string, unknown>)[key]
    return newObject
  }, {} as Record<string, unknown>) as Omit<T, keyof K>
}
