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

export function filterFriendbuyAttributes(
  friendbuyAttributes: Record<string, unknown> | undefined
): [string, string][] {
  const filteredAttributes: [string, string][] = []
  if (friendbuyAttributes) {
    Object.entries(friendbuyAttributes).forEach((attribute) => {
      if (typeof attribute[1] === 'string') {
        filteredAttributes.push(attribute as [string, string])
      }
    })
  }
  return filteredAttributes
}
