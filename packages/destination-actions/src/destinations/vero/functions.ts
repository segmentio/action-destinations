import { PayloadValidationError } from '@segment/actions-core'
import { MAX_ID_LENGTH } from './constants'

export function trim(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function stringify(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  if (typeof value === 'string') {
    return trim(value)
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export function stringifyRecord(
  record: Record<string, unknown> = {},
  excludeKeys: string[] = []
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    const k = trim(key)
    const v = stringify(value)
    if (k && v !== undefined && !excludeKeys.includes(k)) {
      result[k] = v
    }
  }
  return result
}

export function validateId(value: unknown, label = 'User ID'): string | undefined {
  const id = trim(value)
  if (id && id.length > MAX_ID_LENGTH) {
    throw new PayloadValidationError(`${label} must be less than ${MAX_ID_LENGTH} characters.`)
  }
  return id
}

export function requireId(value: unknown, label = 'User ID'): string {
  const id = validateId(value, label)
  if (!id) {
    throw new PayloadValidationError(`${label} is required.`)
  }
  return id
}

export function resolveIdentity(userId: unknown, email: unknown): { id?: string; email?: string } {
  const id = validateId(userId)
  const trimmedEmail = trim(email)
  if (!id && !trimmedEmail) {
    throw new PayloadValidationError('Either User ID or Email is required.')
  }
  return { id, email: trimmedEmail }
}

export function toISODate(value: unknown, label = 'Timestamp'): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const date = new Date(value as string | number)
  if (isNaN(date.getTime())) {
    throw new PayloadValidationError(`${label} must be a valid date.`)
  }
  return date.toISOString()
}

export function cleanStringList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return []
  }
  return Array.from(new Set(values.map((value) => trim(value)).filter((value): value is string => value !== undefined)))
}
