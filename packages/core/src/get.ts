/**
 * Lightweight alternative to lodash.get with similar coverage
 * Supports basic path lookup via dot notation `'foo.bar[0].baz'` or an array ['foo', 'bar', '0', 'baz']
 */

let arrayRe: RegExp

try {
  arrayRe = new RegExp(`\\[(?="|'|\\d)|\\.|(?<="|'|\\d)]+`, 'g')
} catch (e) {
  //safari does not support lookbehind operator so we will default
  //to a simpler approach wherein [bar] will not be a valid key
  arrayRe = /\[|\.|]+/g
}

export function get<T = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  path: string | string[]
): T | undefined {
  // Root value
  if (path === '' || path === '.') return obj

  // Not defined
  if (path === null || path == undefined) return undefined

  // Check if path is string or array. Regex : splits the path into valid array of path chunks
  // we support an extra edge case that lodash does not around brackets
  // a['b'] = ['a','b']
  // a[b] = ['a[b]'] //brackets without numeric index or a string are considered part of the key
  // Regex explained: https://regexr.com/74m2m
  const pathArray = Array.isArray(path)
    ? path
    : path
        .split(arrayRe)
        .filter((f) => f)
        .map((s) => s.replace(/'|"/g, ''))

  // Find value if exist return otherwise return undefined value
  return pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj)
}
