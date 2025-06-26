import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, PayloadValidationError } from '@segment/actions-core'
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
  userId: '123e4567-e89b-12d3-a456-426614174000',
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

const mapping = (eventType: string) => ({
  eventType,
  items: { '@path': '$.properties.items' },
  userIdentifiers: {
    phone: { '@path': '$.context.traits.phone' },
    email: { '@path': '$.context.traits.email' }
  }
})

beforeEach(() => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
})

describe('eCommerce API - Product View, Add to Cart, Purchase', () => {
  it('should send Product Viewed event successfully', async () => {
    const event = createTestEvent({
      ...basePayload,
      event: 'Product Viewed'
    })

    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json'
      }
    })
      .post('/v1/events/ecommerce/product-view', (body) => {
        return (
          body.eventType === 'product-view' &&
          Array.isArray(body.items) &&
          body.items.length === 1 &&
          body.items[0].value === 19.99 &&
          body.items[0].currency === 'USD' &&
          body.user.phone === '+12345556789' &&
          body.user.email === 'user@example.com'
        )
      })
      .reply(200, {})

    const responses = await testDestination.testAction('ecommEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: mapping('product-view')
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send Product Added event successfully', async () => {
    const event = createTestEvent({
      ...basePayload,
      event: 'Product Added'
    })

    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json'
      }
    })
      .post('/v1/events/ecommerce/add-to-cart', (body) => {
        return (
          body.eventType === 'add-to-cart' &&
          Array.isArray(body.items) &&
          body.items.length === 1 &&
          body.items[0].value === 19.99 &&
          body.items[0].currency === 'USD' &&
          body.user.phone === '+12345556789' &&
          body.user.email === 'user@example.com'
        )
      })
      .reply(200, {})

    const responses = await testDestination.testAction('ecommEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: mapping('add-to-cart')
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should send Order Completed event successfully', async () => {
    const event = createTestEvent({
      ...basePayload,
      event: 'Order Completed'
    })

    nock('https://api.attentivemobile.com', {
      reqheaders: {
        authorization: 'Bearer test-api-key',
        'content-type': 'application/json'
      }
    })
      .post('/v1/events/ecommerce/purchase', (body) => {
        return (
          body.eventType === 'purchase' &&
          Array.isArray(body.items) &&
          body.items.length === 1 &&
          body.items[0].value === 19.99 &&
          body.items[0].currency === 'USD' &&
          body.user.phone === '+12345556789' &&
          body.user.email === 'user@example.com'
        )
      })
      .reply(200, {})

    const responses = await testDestination.testAction('ecommEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: mapping('purchase')
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw error if no user identifiers provided', async () => {
    const badPayload = {
      ...basePayload,
      context: { traits: {} },
      userId: undefined
    }

    const event = createTestEvent(badPayload)

    await expect(
      testDestination.testAction('ecommEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          eventType: 'purchase',
          items: { '@path': '$.properties.items' },
          userIdentifiers: {
            phone: { '@path': '$.context.traits.phone' },
            email: { '@path': '$.context.traits.email' }
          }
        }
      })
    ).rejects.toThrowError(new PayloadValidationError('At least one user identifier is required.'))
  })
})
