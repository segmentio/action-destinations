import type { JSONSchema4 } from 'json-schema'
import { isArray, isObject } from './real-type-of'

export function arrify<T>(value: T | T[] | undefined | null, treatNullAsEmpty?: true): T[]
export function arrify<T>(value: T | T[] | undefined | null, treatNullAsEmpty: false): T[] | undefined | null
export function arrify<T>(value: T | T[] | undefined | null, treatNullAsEmpty = true): T[] | undefined | null {
  if (value === undefined || value === null) return treatNullAsEmpty ? [] : (value as undefined | null)
  if (isArray(value)) return value
  return [value]
}

// Coerces non-arrays into arrays based on the jsonschema.
// Mutates the original object
export function arrifyFields(obj: unknown, schema: JSONSchema4 = {}): unknown {
  if (!isObject(obj)) {
    return obj
  }

  if (!schema.properties) return obj

  for (const key of Object.keys(obj)) {
    const fieldSchema = schema.properties[key]
    if (!fieldSchema) continue

    if (fieldSchema.type === 'array') {
      obj[key] = arrify(obj[key], false)
    }
  }

  return obj
}
