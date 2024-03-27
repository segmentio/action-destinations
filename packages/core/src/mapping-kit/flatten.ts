import { JSONLike, JSONLikeObject } from '../json-object'
import { isArray, isObject } from '../real-type-of'

export const flattenObject = (input: JSONLike, prefix = '', separator = '.'): JSONLikeObject => {
  //input may be a primitive value, object, or array
  if (isObject(input) || isArray(input)) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const newKey = prefix ? `${prefix}${separator}${key}` : key
      return {
        ...acc,
        ...flattenObject(value, newKey, separator)
      }
    }, {})
  }
  return { [prefix]: input }
}
