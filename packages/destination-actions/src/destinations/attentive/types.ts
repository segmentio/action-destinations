import { SUBSCRIPTION_TYPES } from "./constants"

export interface EcommEventJSON {
  items: Item[]
  occurredAt?: string
  user: User
}
export interface CustomEventJSON {
  externalEventId?: string
  occurredAt?: string
  user: User
  type: string
  properties?: Record<string, unknown> // cannot contain arrays
}
export interface UpsertUserAttributesJSON {
  properties: Record<string, unknown> // cannot contain arrays or objects
  user: User
}
export interface SubscribeUserJSON {
  externalEventId?: string
  occurredAt?: string
  user: User
  subscriptionType: SubscriptionType
  locale?: {
    language: string
    country: string
  },
  signUpSourceId?: string // locale or signUpSourceId is required
  singleOptIn?: boolean
}
export interface User {
  phone?: string
  email?: string
  externalIdentifiers?: ExternalIdentifiers
}
export interface ExternalIdentifiers {
  clientUserId?: string
  customIdentifiers?: Record<string, unknown>
}
export interface Item {
  productId: string
  productVariantId: string
  productImage?: string
  productUrl?: string
  name?: string
  price: {
    value: number
    currency?: string
  }
  quantity?: number
}
export type SubscriptionType = typeof SUBSCRIPTION_TYPES[number]