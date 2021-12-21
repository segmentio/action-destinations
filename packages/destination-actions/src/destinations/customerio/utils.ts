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

// Recursively walk through an object and try to convert any strings into dates
export const convertAttributeTimestamps = (payload: Record<string, unknown>): Record<string, unknown> => {
  const clone: Record<string, unknown> = {}
  const keys = Object.keys(payload)

  keys.forEach((key) => {
    const value = payload[key]

    if (typeof value === 'string') {
      const maybeDate = dayjs.utc(value)

      if (maybeDate.isValid()) {
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
