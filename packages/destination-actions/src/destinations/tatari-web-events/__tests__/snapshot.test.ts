import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-tatari-web-events'

// generateTestData produces random strings that fail this destination's IP and timestamp validation
const settings = { apiKey: 'snapshot-api-key', environment: 'production' }

const fullEvent = createTestEvent({
  type: 'track',
  event: 'Order Completed',
  messageId: 'snapshot-message-id',
  anonymousId: 'snapshot-anonymous-id',
  userId: 'snapshot-user-id',
  timestamp: '2026-01-15T12:34:56.000Z',
  context: {
    ip: '198.51.100.24',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Snapshot/1.0',
    page: {
      url: 'https://shop.example.com/checkout/complete',
      referrer: 'https://shop.example.com/cart'
    },
    traits: { email: 'snapshot@example.com' }
  },
  properties: {
    order_id: 'ORD-SNAPSHOT-1',
    total: 88.5,
    currency: 'USD',
    products: [{ product_id: 'sku-1', quantity: 2 }]
  }
})

const minimalEvent = createTestEvent({
  type: 'page',
  event: undefined,
  messageId: 'snapshot-message-id-min',
  anonymousId: 'snapshot-anonymous-id',
  userId: undefined,
  timestamp: '2026-01-15T12:34:56.000Z',
  context: {
    ip: '2001:db8:85a3::8a2e:370:7334',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Snapshot/1.0'
  },
  properties: { url: 'https://shop.example.com/' }
})

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  afterEach(() => nock.cleanAll())

  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      nock(/.*/).post(/.*/).reply(200, { status: 'success' })

      const responses = await testDestination.testAction(actionSlug, {
        event: minimalEvent,
        settings,
        useDefaultMappings: true
      })

      const request = responses[0].request
      const rawBody = await request.text()

      expect(request.url).toMatchSnapshot()
      expect(JSON.parse(rawBody)).toMatchSnapshot()
      expect(request.headers).toMatchSnapshot()
    })

    it(`${actionSlug} action - all fields`, async () => {
      nock(/.*/).post(/.*/).reply(200, { status: 'success' })

      const responses = await testDestination.testAction(actionSlug, {
        event: fullEvent,
        settings,
        useDefaultMappings: true
      })

      const request = responses[0].request
      const rawBody = await request.text()

      expect(request.url).toMatchSnapshot()
      expect(JSON.parse(rawBody)).toMatchSnapshot()
    })
  }
})
