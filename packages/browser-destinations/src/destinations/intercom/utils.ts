import { isArray, isObject } from '@segment/actions-core'
import { isNonEmpty } from '@segment/actions-shared'
import dayjs from 'dayjs'

export function convertISO8601toUnix(created_at: string | number): number {
  return dayjs(created_at).unix()
}

export function filterCustomTraits(reservedFields: Array<string>, traits: { [k: string]: unknown } | undefined) {
  const filteredCustomTraits: { [k: string]: unknown } = {}
  if (traits) {
    const reservedFieldsSet = new Set(reservedFields)
    for (const [key, value] of Object.entries(traits)) {
      if (!reservedFieldsSet.has(key) && !isArray(value) && !isObject(value) && value) {
        filteredCustomTraits[key] = value
      }
    }
  }
  return filteredCustomTraits
}

export function isEmpty(o: object | undefined) {
  return !isNonEmpty(o)
}
