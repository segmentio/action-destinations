import { PayloadValidationError } from '@segment/actions-core'

export function sanitizeEventName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
}

export function sanitizeProperties(properties: { [k: string]: unknown }): { [k: string]: string | number | boolean } {
  const result: { [k: string]: string | number | boolean } = {}

  Object.keys(properties).forEach((key) => {
    const value = properties[key]
    const propName = sanitizePropertyName(key)

    if (!/^[a-z]/.test(propName)) {
      throw new PayloadValidationError(
        `Property ${key} in event has an invalid name. Property names must start with a letter.`
      )
    }

    result[propName] =
      typeof value === 'object' && value !== null ? JSON.stringify(value) : (value as string | number | boolean)
  })

  return result
}

export function sanitizePropertyName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9_]/g, '_')
}
