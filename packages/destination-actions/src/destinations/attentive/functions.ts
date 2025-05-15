import { Item, User, AttentiveEcommPayload, AttentiveCustomPayload } from './types'
import { Payload as CustomEvent } from './customEvents/generated-types'
import { Payload as EcommEvent } from './ecommEvent/generated-types'

type UserIdentifiers =
  | CustomEvent['userIdentifiers']
  | EcommEvent['userIdentifiers']

type Items = EcommEvent['items']

function formatUser(userIdentifiers: UserIdentifiers): User {
  const { phone, email, clientUserId, ...customIdentifiers } = userIdentifiers
  return {
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(clientUserId || Object.keys(customIdentifiers || {}).length > 0
      ? {
          externalIdentifiers: {
            ...(clientUserId ? { clientUserId } : {}),
            ...(Object.keys(customIdentifiers || {}).length > 0 ? { customIdentifiers } : {})
          }
        }
      : {})
  }
}

export function formatCustomObject(payload: CustomEvent): AttentiveCustomPayload {
  const {
    externalEventId,
    type, 
    properties,
    occurredAt,
    userIdentifiers
  } = payload
  
  return {
    type,
    properties,
    externalEventId,
    occurredAt,
    user: formatUser(userIdentifiers)
  }
}

function formatItems(items: Items): Array<Item> {
  return items.map(({ value, currency, ...rest }) => ({
    ...rest,
    price: {
      value,
      currency,
    }
  }))
}

export function formatEcommObject(payload: EcommEvent): AttentiveEcommPayload {
  return {
    items: formatItems(payload.items),
    occurredAt: payload.occurredAt,
    user: formatUser(payload.userIdentifiers)
  }
}