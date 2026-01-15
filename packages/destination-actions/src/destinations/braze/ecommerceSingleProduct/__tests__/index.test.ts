import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { EVENT_NAMES } from '../../ecommerce/constants'

let testDestination = createTestIntegration(Definition)

const settings: Settings = {
  api_key: 'test_api_key',
  app_id: 'test_app_id',
  endpoint: 'https://rest.iad-01.braze.com'
}

const payload = {
  event: 'TEST',
  type: 'track',
  userId: 'userId1',
  timestamp: '2024-06-10T12:00:00.000Z',
  properties: {
    email: 'email@email.com',
    user_alias: {
      alias_name: 'alias_name_1',
      alias_label: 'alias_label_1'
    },
    phone: '+14155551234',
    braze_id: 'braze_id_1',
    reason: "I didn't like it",
    order_id: 'order_id_1',
    cart_id: 'cart_id_1',
    checkout_id: 'checkout_id_1',
    total: 100.0,
    discount: 10,
    discount_items: [
      {
        code: 'SUMMER21',
        amount: 5
      },
      {
        code: 'VIPCUSTOMER',
        amount: 5
      }
    ],
    currency: 'USD',
    source: 'test_source',
    product_id: 'prod_1',
    name: 'Product 1',
    variant: 'Size M',
    image_url: 'https://example.com/prod1.jpg',
    product_url: 'https://example.com/prod1',
    price: 25.0,
    metadata: {
      custom_field_1: 'custom_value_1',
      custom_field_2: 100,
      custom_field_3: true,
      custom_field_4: ['a', 'b', 'c'],
      custom_field_5: { nested_key: 'nested_value' },
      checkout_url: 'https://example.com/checkout',
      order_status_url: 'https://example.com/order/status'
    }
  }
} as Partial<SegmentEvent>

const mapping = {
  __segment_internal_sync_mode: 'add',
  name: EVENT_NAMES.PRODUCT_VIEWED,
  external_id: { '@path': '$.userId' },
  user_alias: { '@path': '$.properties.user_alias' },
  email: { '@path': '$.properties.email' },
  phone: { '@path': '$.properties.phone' },
  braze_id: { '@path': '$.properties.braze_id' },
  time: { '@path': '$.timestamp' },
  currency: { '@path': '$.properties.currency' },
  source: { '@path': '$.properties.source' },
  product: {
    product_id: { '@path': '$.properties.product_id' },
    product_name: { '@path': '$.properties.name' },
    variant_id: { '@path': '$.properties.variant' },
    image_url: { '@path': '$.properties.image_url' },
    product_url: { '@path': '$.properties.product_url' },
    price: { '@path': '$.properties.price' }
  },
  metadata: { '@path': '$.properties.metadata' },
  type: { '@path': '$.properties.type' },
  enable_batching: true,
  batch_size: 75
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  jest.clearAllMocks()
  nock.cleanAll()
  done()
})

afterEach(() => {
  nock.cleanAll()
})

describe('Braze.ecommerce', () => {
  describe('single event', () => {
    it('should send Product Viewed event correctly', async () => {
      const json = {
        events: [
          {
            external_id: 'userId1',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: {
              alias_name: 'alias_name_1',
              alias_label: 'alias_label_1'
            },
            app_id: 'test_app_id',
            name: 'ecommerce.product_viewed',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: {
                  nested_key: 'nested_value'
                },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              product_id: 'prod_1',
              product_name: 'Product 1',
              variant_id: 'Size M',
              image_url: 'https://example.com/prod1.jpg',
              product_url: 'https://example.com/prod1',
              price: 25
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.testAction('ecommerceSingleProduct', {
        event: payload,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response.length).toBe(1)
    })
  })

  describe('batch events', () => {
    it('should send batched single product ecommerce events correctly', async () => {
      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({ ...deepCopy1, userId: 'userId1', event: 'ecommerce.product_viewed' })
      const e2 = createTestEvent({ ...deepCopy2, userId: 'userId2', event: 'ecommerce.product_viewed' })
      const e3 = createTestEvent({ ...deepCopy3, userId: 'userId3', event: 'ecommerce.product_viewed' })
      const events = [e1, e2, e3]

      const json = {
        events: [
          {
            external_id: 'userId1',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: {
              alias_name: 'alias_name_1',
              alias_label: 'alias_label_1'
            },
            app_id: 'test_app_id',
            name: 'ecommerce.product_viewed',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: {
                  nested_key: 'nested_value'
                },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              product_id: 'prod_1',
              product_name: 'Product 1',
              variant_id: 'Size M',
              image_url: 'https://example.com/prod1.jpg',
              product_url: 'https://example.com/prod1',
              price: 25
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId2',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: {
              alias_name: 'alias_name_1',
              alias_label: 'alias_label_1'
            },
            app_id: 'test_app_id',
            name: 'ecommerce.product_viewed',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: {
                  nested_key: 'nested_value'
                },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              product_id: 'prod_1',
              product_name: 'Product 1',
              variant_id: 'Size M',
              image_url: 'https://example.com/prod1.jpg',
              product_url: 'https://example.com/prod1',
              price: 25
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId3',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: {
              alias_name: 'alias_name_1',
              alias_label: 'alias_label_1'
            },
            app_id: 'test_app_id',
            name: 'ecommerce.product_viewed',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: {
                  nested_key: 'nested_value'
                },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              product_id: 'prod_1',
              product_name: 'Product 1',
              variant_id: 'Size M',
              image_url: 'https://example.com/prod1.jpg',
              product_url: 'https://example.com/prod1',
              price: 25
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).matchHeader('X-Braze-Batch', 'true').reply(200)

      const response = await testDestination.testBatchAction('ecommerceSingleProduct', {
        events,
        settings,
        mapping
      })

      expect(response.length).toBe(1)
    })
  })
})
