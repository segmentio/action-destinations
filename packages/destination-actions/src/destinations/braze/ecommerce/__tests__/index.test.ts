import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent } from '@segment/actions-core'
import Definition from '../../index'
import { Settings } from '../../generated-types'
import { EVENT_NAMES } from '../constants'

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
    products: [
      {
        product_id: 'prod_1',
        name: 'Product 1',
        variant: 'Size M',
        image_url: 'https://example.com/prod1.jpg',
        product_url: 'https://example.com/prod1',
        quantity: 2,
        price: 25.0,
        color: 'red',
        size: 'M'
      },
      {
        product_id: 'prod_2',
        name: 'Product 2',
        variant: 'Size L',
        image_url: 'https://example.com/prod2.jpg',
        product_url: 'https://example.com/prod2',
        quantity: 1,
        price: 50.0
      }
    ],
    product: {
      product_id: 'prod_1',
      name: 'Product 1',
      variant: 'Size M',
      image_url: 'https://example.com/prod1.jpg',
      product_url: 'https://example.com/prod1',
      price: 25.0
    },
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
  name: EVENT_NAMES.ORDER_PLACED,
  external_id: { '@path': '$.userId' },
  user_alias: { '@path': '$.properties.user_alias' },
  email: { '@path': '$.properties.email' },
  phone: { '@path': '$.properties.phone' },
  braze_id: { '@path': '$.properties.braze_id' },
  cancel_reason: { '@path': '$.properties.reason' },
  time: { '@path': '$.timestamp' },
  checkout_id: { '@path': '$.properties.checkout_id' },
  order_id: { '@path': '$.properties.order_id' },
  cart_id: { '@path': '$.properties.cart_id' },
  total_value: { '@path': '$.properties.total' },
  total_discounts: { '@path': '$.properties.discount' },
  discounts: { '@path': '$.properties.discount_items' },
  currency: { '@path': '$.properties.currency' },
  source: { '@path': '$.properties.source' },
  products: {
    '@arrayPath': [
      '$.properties.products',
      {
        product_id: { '@path': '$.product_id' },
        product_name: { '@path': '$.name' },
        variant_id: { '@path': '$.variant' },
        image_url: { '@path': '$.image_url' },
        product_url: { '@path': '$.url' },
        quantity: { '@path': '$.quantity' },
        price: { '@path': '$.price' },
        color: { '@path': '$.color' },
        size: { '@path': '$.size' }
      }
    ]
  },
  product: {
    product_id: { '@path': '$.properties.product.product_id' },
    product_name: { '@path': '$.properties.product.name' },
    variant_id: { '@path': '$.properties.product.variant' },
    image_url: { '@path': '$.properties.product.image_url' },
    product_url: { '@path': '$.properties.product.url' },
    price: { '@path': '$.properties.product.price' }
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
    it('should send Order Completed event correctly', async () => {
      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const e = createTestEvent(deepCopy)
      delete e.properties?.product

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
            name: 'ecommerce.order_placed',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: 'red',
                    size: 'M'
                  }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ],
              cart_id: 'cart_id_1',
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
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping
      })

      expect(response.length).toBe(1)
    })

    it('should send Checkout Started event correctly', async () => {
      const mapping2 = {
        ...mapping,
        name: EVENT_NAMES.CHECKOUT_STARTED
      }

      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const e = createTestEvent(deepCopy)
      delete e.properties?.product

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
            name: 'ecommerce.checkout_started',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: 'red',
                    size: 'M'
                  }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: 'checkout_id_1',
              cart_id: 'cart_id_1',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping: mapping2
      })

      expect(response.length).toBe(1)
    })

    it('should send Order Refunded event correctly', async () => {
      const mapping2 = {
        ...mapping,
        name: EVENT_NAMES.ORDER_REFUNDED
      }

      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const e = createTestEvent(deepCopy)
      delete e.properties?.product

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
            name: 'ecommerce.order_refunded',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: 'red',
                    size: 'M'
                  }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ],
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping: mapping2
      })

      expect(response.length).toBe(1)
    })

    it('should send Order Cancelled event correctly', async () => {
      const mapping2 = {
        ...mapping,
        name: EVENT_NAMES.ORDER_CANCELLED
      }

      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const e = createTestEvent(deepCopy)
      delete e.properties?.product

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
            name: 'ecommerce.order_cancelled',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: 'red',
                    size: 'M'
                  }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ],
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping: mapping2
      })

      expect(response.length).toBe(1)
    })

    it('should throw an error if missing identifier', async () => {
      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const e = createTestEvent(deepCopy)

      e.userId = undefined
      delete e.properties?.email
      delete e.properties?.phone
      delete e.properties?.braze_id
      delete e.anonymousId
      delete e.properties?.user_alias

      await expect(
        testDestination.testAction('ecommerce', {
          event: e,
          settings,
          useDefaultMappings: true,
          mapping
        })
      ).rejects.toThrowError(
        new Error('One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.')
      )
    })

    it('should default syncMode to add if missing', async () => {
      nock(settings.endpoint).post('/users/track').reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: payload,
        settings,
        useDefaultMappings: true,
        mapping: {
          ...mapping,
          __segment_internal_sync_mode: ''
        }
      })

      expect(response.length).toBe(1)
    })
  })

  describe('batch events', () => {
    it('should send batched multi product ecommerce events correctly', async () => {
      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy4: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({ ...deepCopy1, userId: 'userId1', event: 'ecommerce.order_placed' })
      const e2 = createTestEvent({ ...deepCopy2, userId: 'userId2', event: 'ecommerce.order_refunded' })
      const e3 = createTestEvent({ ...deepCopy3, userId: 'userId3', event: 'ecommerce.checkout_started' })
      const e4 = createTestEvent({ ...deepCopy4, userId: 'userId4', event: 'ecommerce.order_cancelled' })
      const events = [e1, e2, e3, e4]

      const mapping2 = {
        ...mapping,
        name: { '@path': '$.event' }
      }

      const json = {
        events: [
          {
            external_id: 'userId1',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_placed',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ],
              cart_id: 'cart_id_1'
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId2',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_refunded',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  metadata: { color: 'red', size: 'M' },
                  price: 25
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ]
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId3',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.checkout_started',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: 'checkout_id_1',
              cart_id: 'cart_id_1'
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId4',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_cancelled',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ]
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint).post('/users/track', json).matchHeader('X-Braze-Batch', 'true').reply(200)

      const response = await testDestination.testBatchAction('ecommerce', {
        events,
        settings,
        mapping: mapping2
      })

      expect(response.length).toBe(1)
    })

    it('should return correct multistatus response if there is a bad event', async () => {
      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy4: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({ ...deepCopy1, userId: 'userId1', event: 'ecommerce.order_refunded' })

      const e2 = createTestEvent({ ...deepCopy2 })
      e2.userId = undefined
      delete e2.properties?.email
      delete e2.properties?.phone
      delete e2.properties?.braze_id
      delete e2.anonymousId
      delete e2.properties?.user_alias
      e2.event = 'ecommerce.order_placed'

      const e3 = createTestEvent({ ...deepCopy3, userId: 'userId3', event: 'ecommerce.checkout_started' })
      const e4 = createTestEvent({ ...deepCopy4, userId: 'userId4', event: 'ecommerce.order_cancelled' })

      const events = [e1, e2, e3, e4]

      const json = {
        events: [
          {
            external_id: 'userId1',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_refunded',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ]
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId3',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.checkout_started',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: 'checkout_id_1',
              cart_id: 'cart_id_1'
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId4',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_cancelled',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ]
            },
            _update_existing_only: true
          }
        ]
      }

      const mapping2 = {
        ...mapping,
        name: { '@path': '$.event' }
      }

      const responseJSON = [
        {
          status: 200,
          sent: json.events[0],
          body: { success: true }
        },
        {
          status: 400,
          errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.',
          errortype: 'BAD_REQUEST',
          errorreporter: 'INTEGRATIONS'
        },
        {
          status: 200,
          sent: json.events[1],
          body: { success: true }
        },
        {
          status: 200,
          sent: json.events[2],
          body: { success: true }
        }
      ]

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.executeBatch('ecommerce', {
        events,
        settings,
        mapping: mapping2
      })

      expect(response).toEqual(responseJSON)
    })

    it('should attribute Braze errors to the correct payload when an earlier payload is filtered by validate()', async () => {
      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      // e1 is missing all identifiers, so validate() filters it out of the events array sent to Braze.
      const e1 = createTestEvent({ ...deepCopy1, event: 'ecommerce.order_refunded' })
      e1.userId = undefined
      delete e1.properties?.email
      delete e1.properties?.phone
      delete e1.properties?.braze_id
      delete e1.anonymousId
      delete e1.properties?.user_alias

      const e2 = createTestEvent({ ...deepCopy2, userId: 'userId2', event: 'ecommerce.checkout_started' })
      const e3 = createTestEvent({ ...deepCopy3, userId: 'userId3', event: 'ecommerce.order_cancelled' })

      const events = [e1, e2, e3]

      // e1 filtered => events sent to Braze are [e2, e3] at sent-array indices 0 and 1.
      // Braze reports an error for sent-array index 1, which is e3 (original index 2).
      // e3's JSON is valid; we're faking a failed Braze response for that item purely to
      // verify the error is attributed back to the correct original payload.
      let sentJson: any
      nock(settings.endpoint)
        .post('/users/track', (body) => {
          sentJson = body
          return true
        })
        .reply(200, { errors: [{ index: 1, type: 'a valid identifier is required' }] })

      const response = await testDestination.executeBatch('ecommerce', {
        events,
        settings,
        mapping: { ...mapping, __segment_internal_sync_mode: 'update', name: { '@path': '$.event' } }
      })

      expect(response[0]).toEqual({
        status: 400,
        errortype: 'BAD_REQUEST',
        errorreporter: 'INTEGRATIONS',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.'
      })
      expect(response[1]).toEqual({
        status: 200,
        sent: sentJson.events[0],
        body: { success: true }
      })
      expect(response[2]).toEqual({
        status: 400,
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION',
        errormessage: 'a valid identifier is required',
        sent: sentJson.events[1],
        body: 'a valid identifier is required'
      })
    })

    it('should populate sent and body correctly for a fully successful batch', async () => {
      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({ ...deepCopy1, userId: 'userId1', event: 'ecommerce.order_placed' })
      const e2 = createTestEvent({ ...deepCopy2, userId: 'userId2', event: 'ecommerce.checkout_started' })
      const events = [e1, e2]

      let sentJson: any
      nock(settings.endpoint)
        .post('/users/track', (body) => {
          sentJson = body
          return true
        })
        .reply(200)

      const response = await testDestination.executeBatch('ecommerce', {
        events,
        settings,
        mapping: { ...mapping, __segment_internal_sync_mode: 'add', name: { '@path': '$.event' } }
      })

      expect(response[0]).toEqual({
        status: 200,
        sent: sentJson.events[0],
        body: { success: true }
      })
      expect(response[1]).toEqual({
        status: 200,
        sent: sentJson.events[1],
        body: { success: true }
      })
    })

    it('should default syncMode to add and return correct multistatus response if there is no SyncMode', async () => {
      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy4: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({ ...deepCopy1, userId: 'userId1', event: 'ecommerce.order_refunded' })

      const e2 = createTestEvent({ ...deepCopy2 })
      e2.userId = undefined
      delete e2.properties?.email
      delete e2.properties?.phone
      delete e2.properties?.braze_id
      delete e2.anonymousId
      delete e2.properties?.user_alias
      e2.event = 'ecommerce.order_placed'

      const e3 = createTestEvent({ ...deepCopy3, userId: 'userId3', event: 'ecommerce.checkout_started' })
      const e4 = createTestEvent({ ...deepCopy4, userId: 'userId4', event: 'ecommerce.order_cancelled' })

      const events = [e1, e2, e3, e4]

      const json = {
        events: [
          {
            external_id: 'userId1',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_refunded',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ]
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId3',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.checkout_started',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: 'checkout_id_1',
              cart_id: 'cart_id_1'
            },
            _update_existing_only: true
          },
          {
            external_id: 'userId4',
            braze_id: 'braze_id_1',
            email: 'email@email.com',
            phone: '+14155551234',
            user_alias: { alias_name: 'alias_name_1', alias_label: 'alias_label_1' },
            app_id: 'test_app_id',
            name: 'ecommerce.order_cancelled',
            time: '2024-06-10T12:00:00.000Z',
            properties: {
              currency: 'USD',
              source: 'test_source',
              metadata: {
                custom_field_1: 'custom_value_1',
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ['a', 'b', 'c'],
                custom_field_5: { nested_key: 'nested_value' },
                checkout_url: 'https://example.com/checkout',
                order_status_url: 'https://example.com/order/status'
              },
              products: [
                {
                  product_id: 'prod_1',
                  product_name: 'Product 1',
                  variant_id: 'Size M',
                  image_url: 'https://example.com/prod1.jpg',
                  quantity: 2,
                  price: 25,
                  metadata: { color: 'red', size: 'M' }
                },
                {
                  product_id: 'prod_2',
                  product_name: 'Product 2',
                  variant_id: 'Size L',
                  image_url: 'https://example.com/prod2.jpg',
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: 'order_id_1',
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: 'SUMMER21', amount: 5 },
                { code: 'VIPCUSTOMER', amount: 5 }
              ]
            },
            _update_existing_only: true
          }
        ]
      }

      const mapping2 = {
        ...mapping,
        __segment_internal_sync_mode: '',
        name: { '@path': '$.event' }
      }

      const responseJSON = [
        {
          status: 200,
          sent: json.events[0],
          body: { success: true }
        },
        {
          status: 400,
          errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.',
          errortype: 'BAD_REQUEST',
          errorreporter: 'INTEGRATIONS'
        },
        {
          status: 200,
          sent: json.events[1],
          body: { success: true }
        },
        {
          status: 200,
          sent: json.events[2],
          body: { success: true }
        }
      ]

      nock(settings.endpoint).post('/users/track', json).reply(200)

      const response = await testDestination.executeBatch('ecommerce', {
        events,
        settings,
        mapping: mapping2
      })

      expect(response).toEqual(responseJSON)
    })
  })

  describe('syncMode (no user_alias present)', () => {
    // All of the tests above use a payload with a fully-formed user_alias, which always forces
    // _update_existing_only to true regardless of syncMode (see the `send` function in
    // ../functions.ts). These tests remove user_alias so the syncMode -> _update_existing_only
    // decision logic is actually exercised.
    it('should set _update_existing_only to true when a valid syncMode of "update" is used', async () => {
      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      delete deepCopy.properties?.user_alias
      const e = createTestEvent(deepCopy)
      delete e.properties?.product

      let sentJson: any
      nock(settings.endpoint)
        .post('/users/track', (body) => {
          sentJson = body
          return true
        })
        .reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping: { ...mapping, __segment_internal_sync_mode: 'update' }
      })

      expect(response.length).toBe(1)
      expect(sentJson.events[0]).toMatchObject({
        name: 'ecommerce.order_placed',
        _update_existing_only: true
      })
      expect(sentJson.events[0].user_alias).toBeUndefined()
    })

    it('should omit _update_existing_only when a valid syncMode of "add" is used', async () => {
      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      delete deepCopy.properties?.user_alias
      const e = createTestEvent(deepCopy)
      delete e.properties?.product

      let sentJson: any
      nock(settings.endpoint)
        .post('/users/track', (body) => {
          sentJson = body
          return true
        })
        .reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping: { ...mapping, __segment_internal_sync_mode: 'add' }
      })

      expect(response.length).toBe(1)
      expect(sentJson.events[0]).toMatchObject({
        name: 'ecommerce.order_placed'
      })
      expect(sentJson.events[0]._update_existing_only).toBeUndefined()
    })
  })
})
