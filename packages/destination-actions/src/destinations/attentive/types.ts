export interface ProductItem {
  productId: string
  productVariantId: string
  productImage?: string
  productUrl?: string
  name?: string
  value: number
  currency?: string
  quantity?: number
}

export interface eCommEventObject {
  items: ProductItem[]
  occurredAt: string
  user: User
}

export interface CustomEventObject {
  type: string
  properties: Record<string, any>
  externalEventId: string
  occurredAt: string
  user: User
}

export interface User {
  phone: string
  email: string
  externalIdentifiers?: ExternalIdentifiers
}

interface ExternalIdentifiers {
  clientUserId?: string
  customIdentifiers?: Record<string, any>
}
