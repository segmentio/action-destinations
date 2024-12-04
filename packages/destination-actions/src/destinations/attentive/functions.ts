import { ProductItem, User, eCommEventObject, CustomEventObject } from './types'

export function formatProductItemsArray(rawProductItemsArray: Array<ProductItem>): Array<ProductItem> {
  return rawProductItemsArray.map((item) => ({
    productId: item.productId,
    productVariantId: item.productVariantId,
    productImage: item.productImage,
    productUrl: item.productUrl,
    name: item.name,
    price: {
      value: item.value,
      currency: item.currency
    },
    quantity: item.quantity
  }))
}

function createUser(
  phone?: string,
  email?: string,
  clientUserId?: string,
  customIdentifiers?: Record<string, any>
): User {
  return {
    phone,
    email,
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

export function getCustomEventsTestPayload(timestamp: string): Partial<SegmentEvent> {
  return {
    timestamp,
    event: 'Event Type 1',
    messageId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'track',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    context: {
      traits: {
        phone: '+3538675765689',
        email: 'test@test.com'
      }
    },
    properties: {
      tracking_url: 'https://tracking-url.com',
      product_name: 'Product X'
    }
  }
}

export function buildCustomEventObject(
  type: string,
  properties: Record<string, any>,
  externalEventId: string,
  occurredAt: string,
  phone?: string,
  email?: string,
  clientUserId?: string,
  customIdentifiers?: Record<string, any>
): CustomEventObject {
  return {
    type,
    properties,
    externalEventId,
    occurredAt,
    user: createUser(phone, email, clientUserId, customIdentifiers)
  }
}

export function buildECommEventObject(
  items: ProductItem[],
  occurredAt: string,
  phone?: string,
  email?: string,
  clientUserId?: string,
  customIdentifiers?: Record<string, any>
): eCommEventObject {
  return {
    items,
    occurredAt,
    user: createUser(phone, email, clientUserId, customIdentifiers)
  }
}
