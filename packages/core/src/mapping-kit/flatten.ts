import { JSONLikeObject } from '../json-object'
import { isObject } from '../real-type-of'

export const flattenObject = (obj: JSONLikeObject, prefix = '', separator = '.'): JSONLikeObject => {
  const newObj: JSONLikeObject = {}

  for (const key of Object.keys(obj)) {
    const value = obj[key]

    if (isObject(value)) {
      Object.assign(newObj, flattenObject(value, `${prefix}${key}${separator}`, separator))
    } else {
      newObj[`${prefix}${key}`] = value
    }
  }

  return newObj
}
