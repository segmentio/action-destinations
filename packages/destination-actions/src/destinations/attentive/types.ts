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

export interface AttentiveEcommPayload {
  items: Item[]
  occurredAt?: string
  user: User
}

export interface AttentiveCustomPayload {
  type: string
  properties?: Record<string, unknown>
  externalEventId?: string
  occurredAt?: string
  user: User
}

export interface User {
  phone?: string
  email?: string
  externalIdentifiers?: ExternalIdentifiers
}

interface ExternalIdentifiers {
  clientUserId?: string
  customIdentifiers?: Record<string, unknown>
}