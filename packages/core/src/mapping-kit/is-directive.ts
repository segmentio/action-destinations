import { JSONObject } from '../json-object'
import { isObject } from '../real-type-of'

export function isDirective(obj: unknown): obj is JSONObject {
  if (!isObject(obj)) {
    return false
  }

  const keys = Object.keys(obj)
  const hasDirectivePrefix = keys.some((key) => key.startsWith('@'))
  if (!hasDirectivePrefix) {
    return false
  }

  // Ensure there aren't any other keys besides `@directive` or `_metadata`
  const otherKeys = keys.filter((key) => !key.startsWith('@') && key !== '_metadata')
  if (otherKeys.length === 0) {
    return true
  }

  return false
}
