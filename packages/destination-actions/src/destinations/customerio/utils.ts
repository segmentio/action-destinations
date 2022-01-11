import dayjs from '../../lib/dayjs'
import isPlainObject from 'lodash/isPlainObject'

export const trackApiEndpoint = (accountRegion?: string) => {
  if (accountRegion === AccountRegion.EU) {
    return 'https://track-eu.customer.io'
  }

  return 'https://track.customer.io'
}

export enum AccountRegion {
  US = 'US 🇺🇸',
  EU = 'EU 🇪🇺'
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return isPlainObject(value)
}

const isIsoDate = (value: string): boolean => {
  //https://github.com/segmentio/isostring/blob/master/index.js
  const isoformat =
    '^\\d{4}-\\d{2}-\\d{2}' + // Match YYYY-MM-DD
    '((T\\d{2}:\\d{2}(:\\d{2})?)' + // Match THH:mm:ss
    '(\\.\\d{1,6})?' + // Match .sssss
    '(Z|(\\+|-)\\d{2}:\\d{2})?)?$' // Time zone (Z or +hh:mm)

  const matcher = new RegExp(isoformat)

  return typeof value === 'string' && matcher.test(value) && !isNaN(Date.parse(value))
}

export const convertValidTimestamp = <Value = unknown>(value: Value): Value | number => {
  // Timestamps may be on a `string` field, so check if the string is only
  // numbers. If it is, ignore it since it's probably already a unix timestamp.
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof value !== 'string' || /^\d+$/.test(value)) {
    return value
  }

  const maybeDate = dayjs.utc(value)

  if (maybeDate.isValid()) {
    return maybeDate.unix()
  }

  return value
}

// Recursively walk through an object and try to convert any strings into dates
export const convertAttributeTimestamps = (payload: Record<string, unknown>): Record<string, unknown> => {
  const clone: Record<string, unknown> = {}
  const keys = Object.keys(payload)

  keys.forEach((key) => {
    const value = payload[key]

    if (typeof value === 'string') {
      // Parse only ISO 8601 date formats in strict mode
      const maybeDate = dayjs(value)

      if (isIsoDate(value)) {
        clone[key] = maybeDate.unix()
        return
      }
    }

    if (isRecord(value)) {
      clone[key] = convertAttributeTimestamps(value)

      return
    }

    clone[key] = value
  })

  return clone
}
