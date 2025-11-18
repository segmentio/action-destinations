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
  event: 'Order Completed',
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
    product: {
      product_id: 'prod_1',
      name: 'Product 1',
      variant: 'Size M',
      image_url: 'https://example.com/prod1.jpg',
      product_url: 'https://example.com/prod1',
      quantity: 2,
      price: 25.0
    },
    products: [
      {
        product_id: 'prod_1',
        name: 'Product 1',
        variant: 'Size M',
        image_url: 'https://example.com/prod1.jpg',
        product_url: 'https://example.com/prod1',
        quantity: 2,
        price: 25.0
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
    metadata: {
      custom_field_1: 'custom_value_1',
      custom_field_2: 100,
      custom_field_3: true,
      custom_field_4: ['a', 'b', 'c'],
      custom_field_5: { nested_key: 'nested_value' },
      checkout_url: 'https://example.com/checkout',
      order_status_url: 'https://example.com/order/status'
    },
    type: 'testType',
  }
} as Partial<SegmentEvent>

const mapping = {
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
  discounts: {'@path': '$.properties.discount_items' },
  currency: { '@path': '$.properties.currency' },
  source: { '@path': '$.properties.source' },
  products: {
      '@arrayPath': [
          '$.properties.products',
          {
              product_id: { '@path': '$.product_id' },
              product_name: { '@path': '$.name' },
              variant_id: { '@path': '$.variant'},
              image_url: {'@path': '$.image_url'},
              product_url: {'@path': '$.url'},
              quantity: {'@path': '$.quantity'},
              price: {'@path': '$.price'}
          }
      ]
  },
  product: { 
      product_id: { '@path': '$.properties.product.product_id' },
      product_name: { '@path': '$.properties.product.name' },
      variant_id: { '@path': '$.properties.product.variant'},
      image_url: {'@path': '$.properties.product.image_url'},
      product_url: {'@path': '$.properties.product.product_url'},
      price: {'@path': '$.properties.product.price'}
  },
  metadata: { '@path': '$.properties.metadata' },
  type: { '@path': '$.properties.type' },
  enable_batching: true,
  batch_size: 75
}

beforeEach((done) => {
  testDestination = createTestIntegration(Definition)
  nock.cleanAll()
  done()
})

describe('Braze.ecommerceEvent', () => {

  it('should throw an error if missing identifier', async () => {

    const event = createTestEvent(payload)

    const e = { ...event }
    delete e.userId
    delete e.properties?.email
    delete e.properties?.phone
    delete e.properties?.braze_id
    delete e.anonymousId
    delete e.properties?.user_alias

    await expect(
      testDestination.testAction('ecommerceEvent', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping
      })
    ).rejects.toThrowError(new Error('One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.'))
  })
})
