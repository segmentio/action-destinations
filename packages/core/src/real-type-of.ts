/**
 * Gets the "true" type of an object, since JS `typeof` often returns `'object'`
 * for arrays, date, regexp, and null
 * @param obj - the object to get the real type of
 */
export function realTypeOf(obj: unknown) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() as
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object'
    | 'function'
    | 'null'
    | 'array'
    | 'regexp'
}

export interface Dictionary<T = unknown> {
  [key: string]: T
}

export function isObject(value: unknown): value is Dictionary {
  return realTypeOf(value) === 'object'
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
