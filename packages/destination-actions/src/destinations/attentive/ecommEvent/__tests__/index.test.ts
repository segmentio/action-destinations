import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index' // adjust path if needed
import { Settings } from '../../generated-types'

let testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'

const settings: Settings = {
  apiKey: 'test-api-key'
}

const baseItem = {
  productId: 'prod_1',
  productVariantId: 'variant_1',
  productImage: 'https://example.com/image.png',
  productUrl: 'https://example.com/product/prod_1',
  name: 'Test Product',
  quantity: 1,
  value: 19.99,
  currency: 'USD'
}

const basePayload = {
  timestamp,
  event: 'eCommerce Event',
  messageId: '123e4567-e89b-12d3-a456-426614174000',
  type: 'track',
  userId: 'testuser123',
  context: {
    traits: {
      phone: '+12345556789',
      email: 'user@example.com'
    }
  },
  properties: {
    items: [baseItem]
  }
} as Partial<SegmentEvent>

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('eCommerce API - Product View, Add to Cart, Purchase', () => {
  it('should send product-view event successfully', async () => {
    const mapping = {
      eventType: 'product-view',
      items: { '@path': '$.properties.items' },
      occurredAt: { '@path': '$.timestamp' },
      userIdentifiers: {
        phone: { '@path': '$.context.traits.phone' },
        email: { '@path': '$.context.traits.email' },
        clientUserId: { '@path': '$.userId' }
      }
    }
    
    const event = createTestEvent(
      basePayload
    )

    nock('https://api.attentivemobile.com')
      .post('/v1/events/ecommerce/product-view',
        {
          items: [
            {
              productId: 'prod_1',
              productVariantId: 'variant_1',
              price: { 
                value: 19.99,
                currency: 'USD'
              },
              productImage: 'https://example.com/image.png',
              productUrl: 'https://example.com/product/prod_1',
              name: 'Test Product',
              quantity: 1
            }
          ],
          user: {
            phone: '+12345556789',
            email: 'user@example.com',
            externalIdentifiers: {
              clientUserId: 'testuser123'
            }
          },
          occurredAt: '2024-01-08T13:52:50.212Z'
        })
      .reply(200, {})

    const responses = await testDestination.testAction('ecommEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        ...mapping,
        eventType: 'product-view',
        userIdentifiers: {
          phone: { '@path': '$.context.traits.phone' },
          email: { '@path': '$.context.traits.email' },
          clientUserId: { '@path': '$.userId' }
        },
        occurredAt: { '@path': '$.timestamp' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send add-to-cart event successfully', async () => {
    const mapping = {
      eventType: 'add-to-cart',
      items: { '@path': '$.properties.items' },
      occurredAt: { '@path': '$.timestamp' },
      userIdentifiers: {
        phone: { '@path': '$.context.traits.phone' },
        email: { '@path': '$.context.traits.email' },
        clientUserId: { '@path': '$.userId' }
      }
    }
    
    const event = createTestEvent(
      basePayload
    )

    nock('https://api.attentivemobile.com')
      .post('/v1/events/ecommerce/add-to-cart',
        {
          items: [
            {
              productId: 'prod_1',
              productVariantId: 'variant_1',
              price: { 
                value: 19.99,
                currency: 'USD'
              },
              productImage: 'https://example.com/image.png',
              productUrl: 'https://example.com/product/prod_1',
              name: 'Test Product',
              quantity: 1
            }
          ],
          user: {
            phone: '+12345556789',
            email: 'user@example.com',
            externalIdentifiers: {
              clientUserId: 'testuser123'
            }
          },
          occurredAt: '2024-01-08T13:52:50.212Z'
        })
      .reply(200, {})

    const responses = await testDestination.testAction('ecommEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        ...mapping,
        eventType: 'add-to-cart',
        userIdentifiers: {
          phone: { '@path': '$.context.traits.phone' },
          email: { '@path': '$.context.traits.email' },
          clientUserId: { '@path': '$.userId' }
        },
        occurredAt: { '@path': '$.timestamp' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send purchase event successfully', async () => {
    const mapping = {
      eventType: 'purchase',
      items: { '@path': '$.properties.items' },
      occurredAt: { '@path': '$.timestamp' },
      userIdentifiers: {
        phone: { '@path': '$.context.traits.phone' },
        email: { '@path': '$.context.traits.email' },
        clientUserId: { '@path': '$.userId' }
      }
    }
    
    const event = createTestEvent(
      basePayload
    )

    nock('https://api.attentivemobile.com')
      .post('/v1/events/ecommerce/purchase',
        {
          items: [
            {
              productId: 'prod_1',
              productVariantId: 'variant_1',
              price: { 
                value: 19.99,
                currency: 'USD'
              },
              productImage: 'https://example.com/image.png',
              productUrl: 'https://example.com/product/prod_1',
              name: 'Test Product',
              quantity: 1
            }
          ],
          user: {
            phone: '+12345556789',
            email: 'user@example.com',
            externalIdentifiers: {
              clientUserId: 'testuser123'
            }
          },
          occurredAt: '2024-01-08T13:52:50.212Z'
        })
      .reply(200, {})

    const responses = await testDestination.testAction('ecommEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        ...mapping,
        eventType: 'purchase',
        userIdentifiers: {
          phone: { '@path': '$.context.traits.phone' },
          email: { '@path': '$.context.traits.email' },
          clientUserId: { '@path': '$.userId' }
        },
        occurredAt: { '@path': '$.timestamp' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})