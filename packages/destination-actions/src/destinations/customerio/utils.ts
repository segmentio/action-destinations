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

// DayJS' docs say,
//   > Parse the given string in ISO 8601 format and return a Day.js object instance.
// but that's not actually true. It will parse non-ISO 8601 date formats just fine,
// which we don't want in this action. Thus, we want to only provide ISO 8601 format
// strings for dayJS to parse with.
const validDateFormats = [
  'YYYY',
  'YYYY-MM',
  'YYYY-MM-DD',
  'YYYY-MM-DDTHH',
  'YYYY-MM-DDTHH:mm',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm:ss.S',
  'YYYY-MM-DDTHH:mm:ss.SS',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHHZ',
  'YYYY-MM-DDTHH:mmZ',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss.SZ',
  'YYYY-MM-DDTHH:mm:ss.SSZ',
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  // dayJS doesn't handle `Z` correctly for ISO 8601 dates. This adds `Z` as a literal character
  // https://github.com/iamkun/dayjs/issues/1729
  'YYYY-MM-DDTHH[Z]',
  'YYYY-MM-DDTHH:mm[Z]',
  'YYYY-MM-DDTHH:mm:ss[Z]',
  'YYYY-MM-DDTHH:mm:ss.S[Z]',
  'YYYY-MM-DDTHH:mm:ss.SS[Z]',
  'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
  'YYYY-MM-DDTHHZZ',
  'YYYY-MM-DDTHH:mmZZ',
  'YYYY-MM-DDTHH:mm:ssZZ',
  'YYYY-MM-DDTHH:mm:ss.SZZ',
  'YYYY-MM-DDTHH:mm:ss.SSZZ',
  'YYYY-MM-DDTHH:mm:ss.SSSZZ'
]

// Recursively walk through an object and try to convert any strings into dates
export const convertAttributeTimestamps = (payload: Record<string, unknown>): Record<string, unknown> => {
  const clone: Record<string, unknown> = {}
  const keys = Object.keys(payload)

  keys.forEach((key) => {
    const value = payload[key]

    if (typeof value === 'string') {
      // Parse only ISO 8601 date formats in strict mode
      const maybeDate = dayjs(value, validDateFormats, true)

      if (maybeDate.isValid()) {
        // Since dayJS thinks `Z` is a literal character and not shorthand for UTC, we need to
        // convert the date to UTC manually.
        if (value.endsWith('Z')) {
          clone[key] = maybeDate.utc(true).unix()
        } else {
          clone[key] = maybeDate.unix()
        }

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
