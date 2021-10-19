import type { JSONSchema4 } from 'json-schema'
import { isArray, isObject } from './real-type-of'
import { arrify } from './arrify'

export function removeEmptyValues(obj: unknown, schema: JSONSchema4) {
  if (isArray(obj)) {
    return obj.filter((item) => removeEmptyValues(item, schema) !== undefined)
  }

  if (isObject(obj)) {
    const newObj = { ...obj }

    for (const key of Object.keys(newObj)) {
      newObj[key] = removeEmptyValues(newObj[key], schema.properties?.[key] ?? {})

      // Remove undefined keys
      if (newObj[key] === undefined) {
        delete newObj[key]
      }
    }

    return newObj
  }

  const schemaType = arrify(schema.type)
  if (obj === 'null' && !schemaType.includes('null')) {
    return undefined
  }

  if (obj === '' && !schemaType.includes('string')) {
    return undefined
  }

  return obj
}
