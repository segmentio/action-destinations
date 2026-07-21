import { SegmentEvent } from '@segment/actions-core' // Adjust the import as needed for your project

// Define the function with a return type for clarity
export function getCustomEventsTestValidPayload(timestamp: string): Partial<SegmentEvent> {
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

export function getCustomEventsTestMapping() {
  return {
    type: { '@path': '$.event' },
    userIdentifiers: {
      phone: { '@path': '$.context.traits.phone' },
      email: { '@path': '$.context.traits.email' },
      clientUserId: { '@path': '$.userId' }
    },
    properties: { '@path': '$.properties' },
    externalEventId: { '@path': '$.messageId' },
    occurredAt: { '@path': '$.timestamp' }
  }
}

export function getCustomEventsTestExpectedPayload(validPayload: Record<string, any>) {
  return {
    type: validPayload.type,
    properties: validPayload.properties,
    externalEventId: validPayload.messageId,
    occurredAt: validPayload.timestamp,
    user: {
      phone: validPayload.context?.traits?.phone,
      email: validPayload.context?.traits?.email,
      externalIdentifiers: {
        clientUserId: validPayload.userId
      }
    }
  }
}

export function getECommEventTestValidPayload(timestamp: string): Partial<SegmentEvent> {
  return {
    timestamp,
    event: 'Product Viewed',
    messageId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'track',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    context: {
      traits: {
        phone: '+3538675765689',
        email: 'test@test.com'
      }
    },
    properties: {
      items: [
        {
          productId: 'prod_123',
          productVariantId: 'var_456',
          productImage: 'https://image-url.com/product.jpg',
          productUrl: 'https://product-url.com',
          name: 'Product X',
          price: {
            value: 29.99,
            currency: 'USD'
          },
          quantity: 1
        }
      ]
    }
  }
}

export function getECommEventTestMapping() {
  return {
    items: [
      {
        productId: { '@path': '$.properties.items[0].productId' },
        productVariantId: { '@path': '$.properties.items[0].productVariantId' },
        productImage: { '@path': '$.properties.items[0].productImage' },
        productUrl: { '@path': '$.properties.items[0].productUrl' },
        name: { '@path': '$.properties.items[0].name' },
        price: {
          value: { '@path': '$.properties.items[0].price.value' },
          currency: { '@path': '$.properties.items[0].price.currency' }
        },
        quantity: { '@path': '$.properties.items[0].quantity' }
      }
    ],
    userIdentifiers: {
      phone: { '@path': '$.context.traits.phone' },
      email: { '@path': '$.context.traits.email' },
      clientUserId: { '@path': '$.userId' }
    },
    occurredAt: { '@path': '$.timestamp' }
  }
}

export function getECommEventTestExpectedPayload(validPayload: Record<string, any>) {
  return {
    items: validPayload.properties?.items,
    occurredAt: validPayload.timestamp,
    user: {
      phone: validPayload.context?.traits?.phone,
      email: validPayload.context?.traits?.email,
      externalIdentifiers: {
        clientUserId: validPayload.userId
      }
    }
  }
}
