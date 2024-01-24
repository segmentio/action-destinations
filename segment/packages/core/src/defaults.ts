import type { JSONSchema4, JSONSchema4Type } from 'json-schema'

export function defaultValues(fields: Record<string, unknown>) {
  const obj: Record<string, JSONSchema4Type> = {}

  for (const field of Object.keys(fields)) {
    const defaultValue = (fields[field] as JSONSchema4).default
    if (typeof defaultValue !== 'undefined') {
      obj[field] = defaultValue
    }
  }

  return obj
}
