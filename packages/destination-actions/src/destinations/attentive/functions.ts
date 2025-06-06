import { PayloadValidationError } from '@segment/actions-core'
import { Item, User, EcommEventJSON, CustomEventJSON, UpsertUserAttributesJSON, SubscribeUserJSON, SubscriptionType } from './types'
import { Payload as CustomEvent } from './customEvents/generated-types'
import { Payload as EcommEvent } from './ecommEvent/generated-types'
import { Payload as CustomAttributesEvent } from './upsertUserAttributes/generated-types'
import { Payload as SubscribeUserEvent } from './subscribeUser/generated-types'

type UserIdentifiers =
  | CustomEvent['userIdentifiers']
  | EcommEvent['userIdentifiers']

type Items = EcommEvent['items']

export function validate(payload: CustomEvent | EcommEvent | CustomAttributesEvent): void {
  const {
    userIdentifiers: { phone, email, clientUserId, ...customIdentifiers }
  } = payload

  if (!email && !phone && !clientUserId && Object.keys(customIdentifiers).length === 0) {
    throw new PayloadValidationError('At least one user identifier is required.')
  }
} 

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

function formatItems(items: Items): Array<Item> {
  return items.map(({ value, currency, ...rest }) => ({
    ...rest,
    price: {
      value,
      currency,
    }
  }))
}

function formatLocale(locale?: string): { language: string, country: string } {
  if (!locale) return { language: 'en', country: 'US' }

  const parts = locale.split('_')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new PayloadValidationError('Invalid locale format. Expected format: "language_country" e.g. "en_US".')
  }

  const [language, country] = parts
  return { language, country }
}

export function formatEcommEventJSON(payload: EcommEvent): EcommEventJSON {
  return {
    items: formatItems(payload.items),
    occurredAt: payload.occurredAt,
    user: formatUser(payload.userIdentifiers)
  }
}

export function formatCustomEventJSON(payload: CustomEvent): CustomEventJSON {
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

export function formatUpsertUserAttributesJSON(payload: CustomAttributesEvent): UpsertUserAttributesJSON {
  const { 
    properties, 
    externalEventId, 
    occurredAt, 
    userIdentifiers 
  } = payload
  
  return {
    properties,
    externalEventId,
    occurredAt,
    user: formatUser(userIdentifiers)
  }
}

export function formatSubscribeUserJSON(payload: SubscribeUserEvent): SubscribeUserJSON {
  const { externalEventId, occurredAt, userIdentifiers, subscriptionType } = payload
  return {
    externalEventId,
    occurredAt,
    subscriptionType: subscriptionType as SubscriptionType,
    locale: formatLocale(payload?.locale),
    user: formatUser(userIdentifiers)
  }
}