import type { JSONObject, JSONValue } from '@segment/actions-core'
import type { FriendbuyAPI } from './commonFields'
import { AnalyticsPayload } from './mapEvent'

export interface GetNameParams {
  name?: string
  firstName?: string
  lastName?: string
}

export function getName(payload: GetNameParams): string | undefined {
  // prettier-ignore
  return (
    payload.name                          ? payload.name :
    payload.firstName && payload.lastName ? `${payload.firstName} ${payload.lastName}`
    :                                       undefined
  )
}

export function addName(payload: GetNameParams | undefined) {
  if (typeof payload === 'object' && !payload.name && payload.firstName && payload.lastName) {
    payload.name = `${payload.firstName} ${payload.lastName}`
  }
}

export function removeCustomerIfNoId(payload: { customer?: { id?: string } }) {
  if (typeof payload !== 'object' || typeof payload.customer !== 'object' || payload.customer.id) {
    return payload
  }

  payload = { ...payload }
  delete payload.customer
  return payload
}

export function moveEventPropertiesToRoot(payload: AnalyticsPayload) {
  if (typeof payload !== 'object' || typeof payload.eventProperties !== 'object') {
    return payload
  }

  const analyticsPayload = {
    ...(payload.eventProperties || {}),
    ...payload
  } as AnalyticsPayload
  delete analyticsPayload.eventProperties
  return analyticsPayload
}

type NotUndefined<T> = T extends undefined ? never : T

/**
 * Returns true if the argument is undefined or an empty string, object, or array.
 */
export function isNonEmpty<T extends unknown>(o: T): o is NotUndefined<T> {
  if (o === undefined || o === '') {
    return false
  }
  if (typeof o !== 'object') {
    return true
  }
  for (const _e in o) {
    return true
  }
  // Not dropping `null` as empty to allow it being used in the future to
  // erase existing properties.
  if (o === null) {
    return true
  }
  return false
}

export type FriendbuyPayloadItem = [string, JSONValue | undefined]

export interface CreateFriendbuyPayloadFlags {
  dropEmpty?: boolean
}

/**
 * Creates an object from a list of key/value pairs, dropping items for which
 * the value is undefined or an empty string.  If the `dropEmpty` flag is
 * specified then values which are empty objects or arrays will also be
 * dropped.
 */
export function createFriendbuyPayload(payloadItems: FriendbuyPayloadItem[], flags: CreateFriendbuyPayloadFlags = {}) {
  const friendbuyPayload: JSONObject = {}
  payloadItems.forEach(([k, v]) => {
    if (!(v === undefined || v === '' || (flags.dropEmpty && !isNonEmpty(v)))) {
      friendbuyPayload[k] = v
    }
  })
  return friendbuyPayload
}

export type DateRecord = {
  year?: number
  month: number
  day: number
}

/**
 * Filter non-string values out of friendbuyAttributes, and convert from object
 * to entries list form required by `createFriendbuyPayload`. Includes special
 * handling for `birthday` attribute, which is converted to a DateRecord.
 */
export function filterFriendbuyAttributes(
  api: FriendbuyAPI,
  friendbuyAttributes: Record<string, unknown> | undefined
): [string, JSONValue][] {
  const filteredAttributes: [string, string | DateRecord][] = []
  if (friendbuyAttributes) {
    Object.entries(friendbuyAttributes).forEach((attribute) => {
      if (typeof attribute[1] === 'string') {
        if (attribute[0] === 'birthday') {
          const dateRecord = parseDate(attribute[1])
          if (dateRecord) {
            filteredAttributes.push([attribute[0], dateRecord])
          }
        } else {
          filteredAttributes.push(attribute as [string, string])
        }
      }
    })
  }

  // prettier-ignore
  return (
    filteredAttributes.length === 0 ? [] :
    api === 'mapi'                  ? [['additionalProperties', createFriendbuyPayload(filteredAttributes)]]
    :                                 filteredAttributes
  )
}

const dateRegexp = /^(?:(\d\d\d\d)-)?(\d\d)-(\d\d)(?:[^\d]|$)/
export function parseDate(date: string | DateRecord | undefined): DateRecord | undefined {
  if (
    typeof date === 'object' &&
    (!('year' in date) || typeof date.year === 'number') &&
    typeof date.month === 'number' &&
    typeof date.day === 'number'
  ) {
    return date
  }

  if (typeof date !== 'string') {
    return undefined
  }

  const match = dateRegexp.exec(date)
  if (!match) {
    return undefined
  }

  const year = match[1] && match[1] !== '0000' ? { year: parseInt(match[1], 10) } : {}
  return { month: parseInt(match[2], 10), day: parseInt(match[3], 10), ...year }
}

// Matches a (non-exponential-form) JSON integer.
const integerRegexp = /^-?(?:0|[1-9][0-9]*)$/

// Matches a (non-exponential-form) JSON number.
const floatRegexp = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/

/**
 * Converts an input that is a integer-format string to a number; otherwise
 * returns the input unaltered.
 *
 * This is intended to be used in front of a function that strictly validates
 * the types of its inputs when you want to a allow string representation of
 * an integer to be allowed for the corresponding integer (that is, "123" for
 * 123).
 */
export function enjoinInteger(input: unknown): unknown {
  return typeof input === 'string' && integerRegexp.test(input) ? parseInt(input) : input
}

/**
 * Converts an input that is a float-format string to a number; otherwise
 * returns the input unaltered.
 */
export function enjoinNumber(input: unknown): unknown {
  return typeof input === 'string' && floatRegexp.test(input) ? parseFloat(input) : input
}

/**
 * Converts an input that is a number to a string; otherwise returns the input
 * unaltered.
 */
export function enjoinString(input: unknown): unknown {
  return typeof input === 'number' ? input.toString() : input
}
