import { isObject } from './real-type-of'

type Dictionary<T = unknown> = {
  [key: string]: T
}

export function removeUndefined<T = unknown>(value: T): T {
  if (Array.isArray(value)) {
    return (value.map((item) => removeUndefined(item)) as unknown) as T
  } else if (isObject(value)) {
    const cleaned: Dictionary = Object.assign({}, value)
    Object.keys(cleaned).forEach((key) => {
      if (cleaned[key] === undefined) {
        delete cleaned[key]
      } else {
        cleaned[key] = removeUndefined(cleaned[key])
      }
    })
    return (cleaned as unknown) as T
  }

  return value
}
