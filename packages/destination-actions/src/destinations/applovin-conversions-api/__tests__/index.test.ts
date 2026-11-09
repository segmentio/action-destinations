import nock from 'nock'
import { createTestEvent, createTestIntegration, defaultValues } from '@segment/actions-core'
import Destination from '../index'
import { processHashing } from '../../../lib/hashing-utils'

const testDestination = createTestIntegration(Destination)
const settings = { pixel_id: 'pixel-123', api_key: 'api-key-abc' }
const API = 'https://b.applovin.com'
const EVENT_TIME = '2026-11-01T10:00:00.000Z'

const sha256 = (value: string) => processHashing(value, 'sha256', 'hex')

const baseContext = {
  ip: '203.0.113.7',
  userAgent: 'Mozilla/5.0 Test',
  page: { url: 'https://shop.example.com/checkout' },
  traits: {},
  integrations: {}
}

const orderProperties = {
  order_id: 'order-9',
  currency: 'USD',
  subtotal: 90,
  shipping: 5,
  tax: 7,
  email: 'Jane.Doe+Work@Gmail.com',
  phone: '+1 (415) 555-9317',
  products: [{ product_id: 'sku-1', name: 'Shoe', price: 45, quantity: 2 }]
}

const orderCompleted = (overrides = {}) =>
  createTestEvent({
    type: 'track',
    event: 'Order Completed',
    messageId: 'msg-1',
    userId: 'customer-12345',
    anonymousId: 'anon-1',
    timestamp: EVENT_TIME,
    context: baseContext,
    integrations: { 'AppLovin Conversions Api': { aleid: 'ale-1', axwrt: 'wrt-1' } },
    properties: orderProperties,
    ...overrides
  })

const expectedPurchase = (dedupeId: string) => ({
  name: 'purchase',
  event_time: Date.parse(EVENT_TIME),
  event_source_url: 'https://shop.example.com/checkout',
  dedupe_id: dedupeId,
  user_data: {
    client_ip_address: '203.0.113.7',
    client_user_agent: 'Mozilla/5.0 Test',
    esi: 'web',
    aleid: 'ale-1',
    axwrt: 'wrt-1',
    client_id: 'anon-1',
    user_id: 'customer-12345',
    email: sha256('janedoe@gmail.com'),
    phone: sha256('14155559317'),
    phone_last10_hashed: sha256('4155559317')
  },
  data: {
    items: [{ item_id: 'sku-1', item_name: 'Shoe', price: 45, quantity: 2 }],
    currency: 'USD',
    value: 90,
    transaction_id: 'order-9',
    shipping: 5,
    tax: 7
  }
})

const purchaseMapping = { name: 'purchase', value: { '@path': '$.properties.subtotal' } }

describe('AppLovin Conversions API', () => {
  afterEach(() => nock.cleanAll())

  describe('perform', () => {
    it('sends a purchase event with the expected request', async () => {
      let body: unknown
      nock(API)
        .post('/v1/event')
        .query({ pixel_id: 'pixel-123' })
        .matchHeader('authorization', 'api-key-abc')
        .reply(200, (_uri, requestBody) => {
          body = requestBody
          return {}
        })

      const responses = await testDestination.testAction('sendEvent', {
        event: orderCompleted(),
        settings,
        useDefaultMappings: true,
        mapping: purchaseMapping
      })

      expect(responses[0].status).toBe(200)
      expect(body).toEqual({ events: [expectedPurchase('msg-1')] })
    })

    it('throws when AppLovin rejects the credentials', async () => {
      nock(API).post('/v1/event').query(true).reply(401, { error: 'unauthorized' })

      await expect(
        testDestination.testAction('sendEvent', {
          event: orderCompleted(),
          settings,
          useDefaultMappings: true,
          mapping: purchaseMapping
        })
      ).rejects.toThrowError('Unauthorized')
    })
  })

  describe('performBatch', () => {
    const batchMapping = { ...defaultValues(Destination.actions.sendEvent.fields), ...purchaseMapping }

    const schemaInvalid = (messageId: string) => orderCompleted({ messageId, context: { ...baseContext, ip: undefined } })

    const businessInvalid = (messageId: string) =>
      orderCompleted({
        messageId,
        userId: undefined,
        anonymousId: undefined,
        integrations: { 'AppLovin Conversions Api': { aleid: 'ale-1' } },
        properties: { ...orderProperties, email: undefined, phone: undefined }
      })

    it('rejects invalid events before and inside performBatch and only sends the valid ones', async () => {
      let body: unknown
      nock(API)
        .post('/v1/event')
        .query({ pixel_id: 'pixel-123' })
        .reply(200, (_uri, requestBody) => {
          body = requestBody
          return {}
        })

      await testDestination.testBatchAction('sendEvent', {
        events: [
          orderCompleted({ messageId: 'msg-0' }),
          schemaInvalid('msg-1'),
          orderCompleted({ messageId: 'msg-2' }),
          businessInvalid('msg-3'),
          orderCompleted({ messageId: 'msg-4' })
        ],
        settings,
        mapping: batchMapping
      })

      expect(body).toEqual({
        events: [expectedPurchase('msg-0'), expectedPurchase('msg-2'), expectedPurchase('msg-4')]
      })

      expect(testDestination.results.at(0)?.multistatus).toEqual([
        { status: 200, sent: expectedPurchase('msg-0'), body: { success: true } },
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "User Data is missing the required field 'client_ip_address'.",
          errorreporter: 'INTEGRATIONS'
        },
        { status: 200, sent: expectedPurchase('msg-2'), body: { success: true } },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage:
            'At least one identifier other than ALEID is required: alart, axwrt, client ID, user ID, email or phone.',
          errorreporter: 'INTEGRATIONS'
        },
        { status: 200, sent: expectedPurchase('msg-4'), body: { success: true } }
      ])
    })

    it('does not call AppLovin when every event is invalid', async () => {
      await testDestination.testBatchAction('sendEvent', {
        events: [schemaInvalid('msg-0'), businessInvalid('msg-1')],
        settings,
        mapping: batchMapping
      })

      expect(testDestination.results.at(0)?.multistatus).toEqual([
        {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: "User Data is missing the required field 'client_ip_address'.",
          errorreporter: 'INTEGRATIONS'
        },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage:
            'At least one identifier other than ALEID is required: alart, axwrt, client ID, user ID, email or phone.',
          errorreporter: 'INTEGRATIONS'
        }
      ])
      expect(nock.pendingMocks()).toHaveLength(0)
    })
  })
})
