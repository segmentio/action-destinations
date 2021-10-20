import { isArray } from './real-type-of'

export function arrify<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return []
  if (isArray(value)) return value
  return [value]
}
