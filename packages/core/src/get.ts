/**
 * Lightweight alternative to lodash.get with similar coverage
 * Supports basic path lookup via dot notation `'foo.bar[0].baz'` or an array ['foo', 'bar', '0', 'baz']
 */
export function get<T = unknown, Default = undefined>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string | string[]
): T | Default | undefined {
  // Root value
  if (path === '' || path === '.') return obj

  // Not defined
  if (path === null || path == undefined) return undefined

  // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
  // Regex explained: https://regexr.com/58j0k
  const pathArray = Array.isArray(path) ? path : (path.match(/([^[.\]])+/g) as string[])

  // Find value if exist return otherwise return undefined value
  return pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj)
}
