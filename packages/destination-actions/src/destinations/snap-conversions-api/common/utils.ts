import { IntegrationError } from '@segment/actions-core'
import { createHash } from 'crypto'

export const isNullOrUndefined = <T>(v: T | null | undefined): v is null | undefined => v == null

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

const isHashedEmail = (email: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(email)

export const hashEmailSafe = (email: string | undefined): string | undefined =>
  isHashedEmail(String(email)) ? email : hash(email)

export const raiseMisconfiguredRequiredFieldErrorIf = (condition: boolean, message: string) => {
  if (condition) {
    throw new IntegrationError(message, 'Misconfigured required field', 400)
  }
}

// Use an interface to work around typescript limitation of using arrow functions for assertions
interface S {
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined<T>(v: T | undefined, message: string): asserts v is T
}

export const raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined: S['raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined'] =
  <T>(v: T | undefined, message: string): asserts v is T =>
    raiseMisconfiguredRequiredFieldErrorIf(isNullOrUndefined(v), message)

export const box = (v: string | undefined): readonly string[] | undefined =>
  (v ?? '').length > 0 ? [v as string] : undefined

export const emptyObjectToUndefined = <T extends { [k in string]?: unknown }>(v: T) => {
  const properties = Object.getOwnPropertyNames(v)

  if (properties.length === 0) {
    return undefined
  }

  for (const prop of properties) {
    if (v[prop] !== undefined) {
      return v
    }
  }

  return undefined
}

export const splitListValueToArray = (input: string): readonly string[] | undefined => {
  // Default to comma seperated values unless semi-colons are present
  const separator = input.includes(';') ? ';' : ','

  // split on the separator, remove whitespace and remove any empty values.
  const result = input
    .split(separator)
    .map((x) => x.trim())
    .filter((x) => x != '')

  return result.length > 0 ? result : undefined
}

export const emptyStringToUndefined = (v: string | undefined): string | undefined => {
  const trimmed = v?.trim()
  return (trimmed ?? '').length > 0 ? trimmed : undefined
}

export const parseNumberSafe = (v: string | number | undefined): number | undefined => {
  if (Number.isSafeInteger(v)) {
    return v as number
  } else if (v != null) {
    const parsed = Number.parseInt(String(v) ?? '')
    return Number.isSafeInteger(parsed) ? parsed : undefined
  }
  return undefined
}
