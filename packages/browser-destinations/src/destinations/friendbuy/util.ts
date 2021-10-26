import { isObject } from '@segment/actions-core'

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

export function isEmptyObject(o: unknown) {
  if (!isObject(o)) {
    return false
  }
  for (const _e in o) {
    return false
  }
  return true
}

export type FriendbuyPayloadValue = string | number | boolean | object

export interface CreateFriendbuyPayloadFlags {
  dropEmptyObjects?: boolean
}

/**
 * Creates an object from a list of key/value pairs, dropping items for which
 * the value is undefined or an empty string.  If the `dropEmptyObjects` flag
 * is specified then values which are empty objects will also be dropped.
 */
export function createFriendbuyPayload(
  payloadItems: [string, FriendbuyPayloadValue | undefined][],
  flags: CreateFriendbuyPayloadFlags = {}
) {
  const friendbuyPayload: Record<string, FriendbuyPayloadValue> = {}
  payloadItems.forEach(([k, v]) => {
    if (!(v === undefined || v === '' || (flags.dropEmptyObjects && isEmptyObject(v)))) {
      friendbuyPayload[k] = v
    }
  })
  return friendbuyPayload
}

export interface DateRecord {
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
  friendbuyAttributes: Record<string, unknown> | undefined
): [string, string | DateRecord][] {
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
  return filteredAttributes
}

const dateRegexp = /^(?:(\d\d\d\d)-)?(\d\d)-(\d\d)(?:[^\d]|$)/
export function parseDate(date: string): DateRecord | undefined {
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
