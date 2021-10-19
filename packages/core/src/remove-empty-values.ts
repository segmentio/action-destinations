import type { JSONSchema4 } from 'json-schema'
import { isArray, isObject } from './real-type-of'
import { arrify } from './arrify'

export function removeEmptyValues(obj: unknown, schema: JSONSchema4 = {}): unknown {
  if (isArray(obj)) {
    return obj.filter((item) => removeEmptyValues(item, schema) !== undefined)
  }

  if (isObject(obj)) {
    const newObj = { ...obj }

    for (const key of Object.keys(newObj)) {
      newObj[key] = removeEmptyValues(newObj[key], schema.properties?.[key])

      // Remove undefined keys
      if (newObj[key] === undefined) {
        delete newObj[key]
      }
    }

    return newObj
  }

  const schemaType = arrify(schema.type)

  // Only remove `null` when the schema doesn't allow 'null'
  // because it may not be coercible to a valid value in Ajv
  if (obj === 'null' && !schemaType.includes('null')) {
    return undefined
  }

  // Only remove empty strings if the schema type is not 'string'
  // because it may not be coercible to a valid value in Ajv
  if (obj === '' && !schemaType.includes('string')) {
    return undefined
  }

  return obj
}
