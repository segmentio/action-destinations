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

export function validate(payload: CustomEvent | EcommEvent | CustomAttributesEvent | SubscribeUserEvent) {
  const {
    userIdentifiers: { phone, email, clientUserId, ...customIdentifiers }
  } = payload

  if (!email && !phone && !clientUserId && Object.keys(customIdentifiers).length === 0) {
    throw new PayloadValidationError('At least one user identifier is required.')
  }
} 

export function validateSubscribeUser(payload: SubscribeUserEvent) {
  const { userIdentifiers, locale } = payload 
  if (!userIdentifiers && !locale) {
    throw new PayloadValidationError('Either locale or signUpSourceId is required.')
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
  if(!locale) {
    throw new PayloadValidationError('Locale Signup Source ID is required.')
  }
  const parts = locale.split('-')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new PayloadValidationError('Invalid locale format. Expected format: "language-country" e.g. "en-US".')
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
  
  if (Object.values(properties ?? {}).some(value => Array.isArray(value))) {
    throw new PayloadValidationError('Properties cannot contain arrays.')
  }

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
    userIdentifiers 
  } = payload

  if (Object.values(properties ?? {}).some(value => typeof value === 'object' || Array.isArray(value))) {
    throw new PayloadValidationError('Properties cannot contain objects or arrays.')
  }

  return {
    properties,
    user: formatUser(userIdentifiers)
  }
}

export function formatSubscribeUserJSON(payload: SubscribeUserEvent): SubscribeUserJSON {
  const { externalEventId, occurredAt, userIdentifiers, subscriptionType, signUpSourceId, singleOptIn } = payload
  return {
    externalEventId,
    occurredAt,
    subscriptionType: subscriptionType as SubscriptionType,
    locale: formatLocale(payload?.locale),
    signUpSourceId,
    singleOptIn,
    user: formatUser(userIdentifiers)
  }
}