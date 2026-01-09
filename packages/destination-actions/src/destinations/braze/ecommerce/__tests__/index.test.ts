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
      price: 25.0,
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
              price: {'@path': '$.price'}, 
              color: { '@path': '$.color' },
              size: { '@path': '$.size' }
          }
      ]
  },
  product: {
      product_id: { '@path': '$.properties.product.product_id' },
      product_name: { '@path': '$.properties.product.name' },
      variant_id: { '@path': '$.properties.product.variant'},
      image_url: {'@path': '$.properties.product.image_url'},
      product_url: {'@path': '$.properties.product.url'},
      price: {'@path': '$.properties.product.price'}
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
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: {
              alias_name: "alias_name_1",
              alias_label: "alias_label_1"
            },
            app_id: "test_app_id",
            name: "ecommerce.order_placed",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: "red",
                    size: "M"
                  }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ],
              cart_id: "cart_id_1",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: {
                  nested_key: "nested_value"
                },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

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
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: {
              alias_name: "alias_name_1",
              alias_label: "alias_label_1"
            },
            app_id: "test_app_id",
            name: "ecommerce.checkout_started",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: "red",
                    size: "M"
                  }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: "checkout_id_1",
              cart_id: "cart_id_1",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

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
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: {
              alias_name: "alias_name_1",
              alias_label: "alias_label_1"
            },
            app_id: "test_app_id",
            name: "ecommerce.order_refunded",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: "red",
                    size: "M"
                  }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ],
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

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
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: {
              alias_name: "alias_name_1",
              alias_label: "alias_label_1"
            },
            app_id: "test_app_id",
            name: "ecommerce.order_cancelled",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: {
                    color: "red",
                    size: "M"
                  }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ],
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

      const response = await testDestination.testAction('ecommerce', {
        event: e,
        settings,
        useDefaultMappings: true,
        mapping: mapping2
      })
    
      expect(response.length).toBe(1)
    })  

    // it('should send Cart Updated event correctly', async () => {

    //   const mapping2 = { 
    //     ...mapping, 
    //     name: EVENT_NAMES.CART_UPDATED
    //   }

    //   const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
    //   const e = createTestEvent(deepCopy)
    //   //delete e.properties?.product

    //   const json = {
    //     events: [
    //       {
    //         external_id: "userId1",
    //         braze_id: "braze_id_1",
    //         email: "email@email.com",
    //         phone: "+14155551234",
    //         user_alias: {
    //           alias_name: "alias_name_1",
    //           alias_label: "alias_label_1"
    //         },
    //         app_id: "test_app_id",
    //         name: "ecommerce.cart_updated",
    //         time: "2024-06-10T12:00:00.000Z",
    //         properties: {
    //           currency: "USD",
    //           source: "test_source",
    //           metadata: {
    //             custom_field_1: "custom_value_1",
    //             custom_field_2: 100,
    //             custom_field_3: true,
    //             custom_field_4: ["a", "b", "c"],
    //             custom_field_5: { nested_key: "nested_value" },
    //             checkout_url: "https://example.com/checkout",
    //             order_status_url: "https://example.com/order/status"
    //           },
    //           products: [
    //             {
    //               product_id: "prod_1",
    //               product_name: "Product 1",
    //               variant_id: "Size M",
    //               image_url: "https://example.com/prod1.jpg",
    //               quantity: 2,
    //               price: 25,
    //               metadata: {
    //                 color: "red",
    //                 size: "M"
    //               }
    //             },
    //             {
    //               product_id: "prod_2",
    //               product_name: "Product 2",
    //               variant_id: "Size L",
    //               image_url: "https://example.com/prod2.jpg",
    //               quantity: 1,
    //               price: 50
    //             }
    //           ],
    //           total_value: 100,
    //           cart_id: "cart_id_1"
    //         },
    //         _update_existing_only: true
    //       }
    //     ]
    //   }

    //   nock(settings.endpoint)
    //     .post('/users/track', json)
    //     .reply(200)

    //   const response = await testDestination.testAction('ecommerce', {
    //     event: e,
    //     settings,
    //     useDefaultMappings: true,
    //     mapping: mapping2
    //   })
    
    //   expect(response.length).toBe(1)
    // })  

    it('should send Product Viewed event correctly', async () => {

      const mapping2 = { 
        ...mapping, 
        name: EVENT_NAMES.PRODUCT_VIEWED
      }

      const payload2 = JSON.parse(JSON.stringify(payload))
      payload2.properties.products = undefined 

      const deepCopy: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload2))
      const e = createTestEvent(deepCopy)

      const json = {
        events: [
          {
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.product_viewed",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              product_id: "prod_1",
              product_name: "Product 1",
              variant_id: "Size M",
              image_url: "https://example.com/prod1.jpg",
              price: 25
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

      const response = await testDestination.testAction('ecommerceSingleProduct', {
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
      ).rejects.toThrowError(new Error('One of "external_id" or "user_alias" or "braze_id" or "email" or "phone" is required.'))
    })

    it('should throw an error if missing syncMode', async () => {
      await expect(
        testDestination.testAction('ecommerce', {
          event: payload,
          settings,
          useDefaultMappings: true,
          mapping: {
            ...mapping, 
            __segment_internal_sync_mode: ''
          }
        })
      ).rejects.toThrowError(new Error("Invalid syncMode: undefined. Supported sync modes are 'add' and 'update'."))
    })
  })

  describe('batch events', () => {
    it('should send batched multi product ecommerce events correctly', async () => {

      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy4: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({...deepCopy1, userId: 'userId1', event: 'ecommerce.order_placed' })
      const e2 = createTestEvent({...deepCopy2, userId: 'userId2', event: 'ecommerce.order_refunded' })
      const e3 = createTestEvent({...deepCopy3, userId: 'userId3', event: 'ecommerce.checkout_started' })
      const e4 = createTestEvent({...deepCopy4, userId: 'userId4', event: 'ecommerce.order_cancelled' })
      const events = [e1, e2, e3, e4]

      const mapping2 = { 
        ...mapping, 
        name: { '@path': '$.event' },
      }

      const json = {
        events: [
          {
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_placed",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ],
              cart_id: "cart_id_1"
            },
            _update_existing_only: true
          },
          {
            external_id: "userId2",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_refunded",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  metadata: { color: "red", size: "M" },
                  price: 25
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ]
            },
            _update_existing_only: true
          },
          {
            external_id: "userId3",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.checkout_started",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: "checkout_id_1",
              cart_id: "cart_id_1"
            },
            _update_existing_only: true
          },
          {
            external_id: "userId4",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_cancelled",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ]
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .matchHeader('X-Braze-Batch', 'true')
        .reply(200)

      const response = await testDestination.testBatchAction('ecommerce', {
        events,
        settings,
        mapping: mapping2
      })
    
      expect(response.length).toBe(1)

    })

    it('should send batched single product ecommerce events correctly', async () => {

      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({...deepCopy1, userId: 'userId1', event: 'ecommerce.product_viewed' })
      const e2 = createTestEvent({...deepCopy2, userId: 'userId2', event: 'ecommerce.product_viewed' })
      const e3 = createTestEvent({...deepCopy3, userId: 'userId3', event: 'ecommerce.product_viewed' })
      const events = [e1, e2, e3]

      const mapping2 = { 
        ...mapping, 
        name: { '@path': '$.event' },
      }

      const json = {
        events: [
          {
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.product_viewed",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          },
          {
            external_id: "userId2",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.product_viewed",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          },
          {
            external_id: "userId3",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.product_viewed",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              }
            },
            _update_existing_only: true
          }
        ]
      }

      nock(settings.endpoint)
        .post('/users/track', json)
        .matchHeader('X-Braze-Batch', 'true')
        .reply(200)

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

      const e1 = createTestEvent({...deepCopy1, userId: 'userId1', event: 'ecommerce.order_refunded' })

      const e2 = createTestEvent({...deepCopy2})
      e2.userId = undefined
      delete e2.properties?.email
      delete e2.properties?.phone
      delete e2.properties?.braze_id
      delete e2.anonymousId
      delete e2.properties?.user_alias
      e2.event = 'ecommerce.order_placed'

      const e3 = createTestEvent({...deepCopy3, userId: 'userId3', event: 'ecommerce.checkout_started' })
      const e4 = createTestEvent({...deepCopy4, userId: 'userId4', event: 'ecommerce.order_cancelled' })   

      const events = [e1, e2, e3, e4]
      
      const json = {
        events: [
          {
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_refunded",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ]
            },
            _update_existing_only: true
          },
          {
            external_id: "userId3",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.checkout_started",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: "checkout_id_1",
              cart_id: "cart_id_1"
            },
            _update_existing_only: true
          },
          {
            external_id: "userId4",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_cancelled",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ]
            },
            _update_existing_only: true
          }
        ]
      }

      const mapping2 = { 
        ...mapping, 
        name: { '@path': '$.event' },
      }

      const responseJSON = [
        {
          "status": 200,
          "sent": {
            "name": "ecommerce.order_refunded",
            "external_id": "userId1",
            "user_alias": {
              "alias_name": "alias_name_1",
              "alias_label": "alias_label_1"
            },
            "email": "email@email.com",
            "phone": "+14155551234",
            "braze_id": "braze_id_1",
            "cancel_reason": "I didn't like it",
            "time": "2024-06-10T12:00:00.000Z",
            "checkout_id": "checkout_id_1",
            "order_id": "order_id_1",
            "cart_id": "cart_id_1",
            "total_value": 100,
            "total_discounts": 10,
            "discounts": [
              {
                "code": "SUMMER21",
                "amount": 5
              },
              {
                "code": "VIPCUSTOMER",
                "amount": 5
              }
            ],
            "currency": "USD",
            "source": "test_source",
            "products": [
              {
                "product_id": "prod_1",
                "product_name": "Product 1",
                "variant_id": "Size M",
                "image_url": "https://example.com/prod1.jpg",
                "quantity": 2,
                "price": 25,
                "color": "red",
                "size": "M"
              },
              {
                "product_id": "prod_2",
                "product_name": "Product 2",
                "variant_id": "Size L",
                "image_url": "https://example.com/prod2.jpg",
                "quantity": 1,
                "price": 50
              }
            ],
            "metadata": {
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": [
                "a",
                "b",
                "c"
              ],
              "custom_field_5": {
                "nested_key": "nested_value"
              },
              "checkout_url": "https://example.com/checkout",
              "order_status_url": "https://example.com/order/status"
            },
            "enable_batching": true,
            "batch_size": 75,
            "index": 0
          },
          "body": "{\"external_id\":\"userId1\",\"braze_id\":\"braze_id_1\",\"email\":\"email@email.com\",\"phone\":\"+14155551234\",\"user_alias\":{\"alias_name\":\"alias_name_1\",\"alias_label\":\"alias_label_1\"},\"app_id\":\"test_app_id\",\"name\":\"ecommerce.order_refunded\",\"time\":\"2024-06-10T12:00:00.000Z\",\"properties\":{\"currency\":\"USD\",\"source\":\"test_source\",\"metadata\":{\"custom_field_1\":\"custom_value_1\",\"custom_field_2\":100,\"custom_field_3\":true,\"custom_field_4\":[\"a\",\"b\",\"c\"],\"custom_field_5\":{\"nested_key\":\"nested_value\"},\"checkout_url\":\"https://example.com/checkout\",\"order_status_url\":\"https://example.com/order/status\"},\"products\":[{\"quantity\":2,\"product_id\":\"prod_1\",\"product_name\":\"Product 1\",\"variant_id\":\"Size M\",\"price\":25,\"image_url\":\"https://example.com/prod1.jpg\",\"metadata\":{\"color\":\"red\",\"size\":\"M\"}},{\"quantity\":1,\"product_id\":\"prod_2\",\"product_name\":\"Product 2\",\"variant_id\":\"Size L\",\"price\":50,\"image_url\":\"https://example.com/prod2.jpg\"}],\"total_value\":100,\"order_id\":\"order_id_1\",\"total_discounts\":10,\"discounts\":[{\"code\":\"SUMMER21\",\"amount\":5},{\"code\":\"VIPCUSTOMER\",\"amount\":5}]},\"_update_existing_only\":true}"
        },
        {
          "status": 400,
          "errormessage": "One of \"external_id\" or \"user_alias\" or \"braze_id\" or \"email\" or \"phone\" is required.",
          "sent": {
            "name": "ecommerce.order_placed",
            "cancel_reason": "I didn't like it",
            "time": "2024-06-10T12:00:00.000Z",
            "checkout_id": "checkout_id_1",
            "order_id": "order_id_1",
            "cart_id": "cart_id_1",
            "total_value": 100,
            "total_discounts": 10,
            "discounts": [
              {
                "code": "SUMMER21",
                "amount": 5
              },
              {
                "code": "VIPCUSTOMER",
                "amount": 5
              }
            ],
            "currency": "USD",
            "source": "test_source",
            "products": [
              {
                "product_id": "prod_1",
                "product_name": "Product 1",
                "variant_id": "Size M",
                "image_url": "https://example.com/prod1.jpg",
                "quantity": 2,
                "price": 25,
                "color": "red",
                "size": "M"
              },
              {
                "product_id": "prod_2",
                "product_name": "Product 2",
                "variant_id": "Size L",
                "image_url": "https://example.com/prod2.jpg",
                "quantity": 1,
                "price": 50
              }
            ],
            "metadata": {
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": [
                "a",
                "b",
                "c"
              ],
              "custom_field_5": {
                "nested_key": "nested_value"
              },
              "checkout_url": "https://example.com/checkout",
              "order_status_url": "https://example.com/order/status"
            },
            "enable_batching": true,
            "batch_size": 75
          },
          "errortype": "BAD_REQUEST",
          "errorreporter": "DESTINATION"
        },
        {
          "status": 200,
          "sent": {
            "name": "ecommerce.checkout_started",
            "external_id": "userId3",
            "user_alias": {
              "alias_name": "alias_name_1",
              "alias_label": "alias_label_1"
            },
            "email": "email@email.com",
            "phone": "+14155551234",
            "braze_id": "braze_id_1",
            "cancel_reason": "I didn't like it",
            "time": "2024-06-10T12:00:00.000Z",
            "checkout_id": "checkout_id_1",
            "order_id": "order_id_1",
            "cart_id": "cart_id_1",
            "total_value": 100,
            "total_discounts": 10,
            "discounts": [
              {
                "code": "SUMMER21",
                "amount": 5
              },
              {
                "code": "VIPCUSTOMER",
                "amount": 5
              }
            ],
            "currency": "USD",
            "source": "test_source",
            "products": [
              {
                "product_id": "prod_1",
                "product_name": "Product 1",
                "variant_id": "Size M",
                "image_url": "https://example.com/prod1.jpg",
                "quantity": 2,
                "price": 25,
                "color": "red",
                "size": "M"
              },
              {
                "product_id": "prod_2",
                "product_name": "Product 2",
                "variant_id": "Size L",
                "image_url": "https://example.com/prod2.jpg",
                "quantity": 1,
                "price": 50
              }
            ],
            "metadata": {
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": [
                "a",
                "b",
                "c"
              ],
              "custom_field_5": {
                "nested_key": "nested_value"
              },
              "checkout_url": "https://example.com/checkout",
              "order_status_url": "https://example.com/order/status"
            },
            "enable_batching": true,
            "batch_size": 75,
            "index": 1
          },
          "body": "{\"external_id\":\"userId3\",\"braze_id\":\"braze_id_1\",\"email\":\"email@email.com\",\"phone\":\"+14155551234\",\"user_alias\":{\"alias_name\":\"alias_name_1\",\"alias_label\":\"alias_label_1\"},\"app_id\":\"test_app_id\",\"name\":\"ecommerce.checkout_started\",\"time\":\"2024-06-10T12:00:00.000Z\",\"properties\":{\"currency\":\"USD\",\"source\":\"test_source\",\"metadata\":{\"custom_field_1\":\"custom_value_1\",\"custom_field_2\":100,\"custom_field_3\":true,\"custom_field_4\":[\"a\",\"b\",\"c\"],\"custom_field_5\":{\"nested_key\":\"nested_value\"},\"checkout_url\":\"https://example.com/checkout\",\"order_status_url\":\"https://example.com/order/status\"},\"products\":[{\"quantity\":2,\"product_id\":\"prod_1\",\"product_name\":\"Product 1\",\"variant_id\":\"Size M\",\"price\":25,\"image_url\":\"https://example.com/prod1.jpg\",\"metadata\":{\"color\":\"red\",\"size\":\"M\"}},{\"quantity\":1,\"product_id\":\"prod_2\",\"product_name\":\"Product 2\",\"variant_id\":\"Size L\",\"price\":50,\"image_url\":\"https://example.com/prod2.jpg\"}],\"total_value\":100,\"checkout_id\":\"checkout_id_1\",\"cart_id\":\"cart_id_1\"},\"_update_existing_only\":true}"
        },
        {
          "status": 200,
          "sent": {
            "name": "ecommerce.order_cancelled",
            "external_id": "userId4",
            "user_alias": {
              "alias_name": "alias_name_1",
              "alias_label": "alias_label_1"
            },
            "email": "email@email.com",
            "phone": "+14155551234",
            "braze_id": "braze_id_1",
            "cancel_reason": "I didn't like it",
            "time": "2024-06-10T12:00:00.000Z",
            "checkout_id": "checkout_id_1",
            "order_id": "order_id_1",
            "cart_id": "cart_id_1",
            "total_value": 100,
            "total_discounts": 10,
            "discounts": [
              {
                "code": "SUMMER21",
                "amount": 5
              },
              {
                "code": "VIPCUSTOMER",
                "amount": 5
              }
            ],
            "currency": "USD",
            "source": "test_source",
            "products": [
              {
                "product_id": "prod_1",
                "product_name": "Product 1",
                "variant_id": "Size M",
                "image_url": "https://example.com/prod1.jpg",
                "quantity": 2,
                "price": 25,
                "color": "red",
                "size": "M"
              },
              {
                "product_id": "prod_2",
                "product_name": "Product 2",
                "variant_id": "Size L",
                "image_url": "https://example.com/prod2.jpg",
                "quantity": 1,
                "price": 50
              }
            ],
            "metadata": {
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": [
                "a",
                "b",
                "c"
              ],
              "custom_field_5": {
                "nested_key": "nested_value"
              },
              "checkout_url": "https://example.com/checkout",
              "order_status_url": "https://example.com/order/status"
            },
            "enable_batching": true,
            "batch_size": 75,
            "index": 2
          },
          "body": "{\"external_id\":\"userId4\",\"braze_id\":\"braze_id_1\",\"email\":\"email@email.com\",\"phone\":\"+14155551234\",\"user_alias\":{\"alias_name\":\"alias_name_1\",\"alias_label\":\"alias_label_1\"},\"app_id\":\"test_app_id\",\"name\":\"ecommerce.order_cancelled\",\"time\":\"2024-06-10T12:00:00.000Z\",\"properties\":{\"currency\":\"USD\",\"source\":\"test_source\",\"metadata\":{\"custom_field_1\":\"custom_value_1\",\"custom_field_2\":100,\"custom_field_3\":true,\"custom_field_4\":[\"a\",\"b\",\"c\"],\"custom_field_5\":{\"nested_key\":\"nested_value\"},\"checkout_url\":\"https://example.com/checkout\",\"order_status_url\":\"https://example.com/order/status\"},\"products\":[{\"quantity\":2,\"product_id\":\"prod_1\",\"product_name\":\"Product 1\",\"variant_id\":\"Size M\",\"price\":25,\"image_url\":\"https://example.com/prod1.jpg\",\"metadata\":{\"color\":\"red\",\"size\":\"M\"}},{\"quantity\":1,\"product_id\":\"prod_2\",\"product_name\":\"Product 2\",\"variant_id\":\"Size L\",\"price\":50,\"image_url\":\"https://example.com/prod2.jpg\"}],\"total_value\":100,\"order_id\":\"order_id_1\",\"cancel_reason\":\"I didn't like it\",\"total_discounts\":10,\"discounts\":[{\"code\":\"SUMMER21\",\"amount\":5},{\"code\":\"VIPCUSTOMER\",\"amount\":5}]},\"_update_existing_only\":true}"
        }
      ]
      
      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

      const response = await testDestination.executeBatch('ecommerce', {
        events,
        settings,
        mapping: mapping2
      })

      expect(response).toEqual(responseJSON)
    })

    it('should return correct multistatus response if there no SyncMode', async () => {

      const deepCopy1: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy2: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy3: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))
      const deepCopy4: Partial<SegmentEvent> = JSON.parse(JSON.stringify(payload))

      const e1 = createTestEvent({...deepCopy1, userId: 'userId1', event: 'ecommerce.order_refunded' })

      const e2 = createTestEvent({...deepCopy2})
      e2.userId = undefined
      delete e2.properties?.email
      delete e2.properties?.phone
      delete e2.properties?.braze_id
      delete e2.anonymousId
      delete e2.properties?.user_alias
      e2.event = 'ecommerce.order_placed'

      const e3 = createTestEvent({...deepCopy3, userId: 'userId3', event: 'ecommerce.checkout_started' })
      const e4 = createTestEvent({...deepCopy4, userId: 'userId4', event: 'ecommerce.order_cancelled' })   

      const events = [e1, e2, e3, e4]
      
      const json = {
        events: [
          {
            external_id: "userId1",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_refunded",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ]
            },
            _update_existing_only: true
          },
          {
            external_id: "userId3",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.checkout_started",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              checkout_id: "checkout_id_1",
              cart_id: "cart_id_1"
            },
            _update_existing_only: true
          },
          {
            external_id: "userId4",
            braze_id: "braze_id_1",
            email: "email@email.com",
            phone: "+14155551234",
            user_alias: { alias_name: "alias_name_1", alias_label: "alias_label_1" },
            app_id: "test_app_id",
            name: "ecommerce.order_cancelled",
            time: "2024-06-10T12:00:00.000Z",
            properties: {
              currency: "USD",
              source: "test_source",
              metadata: {
                custom_field_1: "custom_value_1",
                custom_field_2: 100,
                custom_field_3: true,
                custom_field_4: ["a", "b", "c"],
                custom_field_5: { nested_key: "nested_value" },
                checkout_url: "https://example.com/checkout",
                order_status_url: "https://example.com/order/status"
              },
              products: [
                {
                  product_id: "prod_1",
                  product_name: "Product 1",
                  variant_id: "Size M",
                  image_url: "https://example.com/prod1.jpg",
                  quantity: 2,
                  price: 25,
                  metadata: { color: "red", size: "M" }
                },
                {
                  product_id: "prod_2",
                  product_name: "Product 2",
                  variant_id: "Size L",
                  image_url: "https://example.com/prod2.jpg",
                  quantity: 1,
                  price: 50
                }
              ],
              total_value: 100,
              order_id: "order_id_1",
              cancel_reason: "I didn't like it",
              total_discounts: 10,
              discounts: [
                { code: "SUMMER21", amount: 5 },
                { code: "VIPCUSTOMER", amount: 5 }
              ]
            },
            _update_existing_only: true
          }
        ]
      }

      const mapping2 = { 
        ...mapping,
        __segment_internal_sync_mode: '',
        name: { '@path': '$.event' },
      }

      const responseJSON = [
        {
          "errormessage": "Invalid syncMode: undefined. Supported sync modes are 'add' and 'update'.",
          "errorreporter": "DESTINATION",
          "errortype": "BAD_REQUEST",
          "sent": {
            "batch_size": 75,
            "braze_id": "braze_id_1",
            "cancel_reason": "I didn't like it",
            "cart_id": "cart_id_1",
            "checkout_id": "checkout_id_1",
            "currency": "USD",
            "discounts": [
              { "amount": 5, "code": "SUMMER21" },
              { "amount": 5, "code": "VIPCUSTOMER" }
            ],
            "email": "email@email.com",
            "enable_batching": true,
            "external_id": "userId1",
            "metadata": {
              "checkout_url": "https://example.com/checkout",
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": ["a", "b", "c"],
              "custom_field_5": { "nested_key": "nested_value" },
              "order_status_url": "https://example.com/order/status"
            },
            "name": "ecommerce.order_refunded",
            "order_id": "order_id_1",
            "phone": "+14155551234",
            "products": [
              {
                "color": "red",
                "image_url": "https://example.com/prod1.jpg",
                "price": 25,
                "product_id": "prod_1",
                "product_name": "Product 1",
                "quantity": 2,
                "size": "M",
                "variant_id": "Size M"
              },
              {
                "image_url": "https://example.com/prod2.jpg",
                "price": 50,
                "product_id": "prod_2",
                "product_name": "Product 2",
                "quantity": 1,
                "variant_id": "Size L"
              }
            ],
            "source": "test_source",
            "time": "2024-06-10T12:00:00.000Z",
            "total_discounts": 10,
            "total_value": 100,
            "user_alias": {
              "alias_label": "alias_label_1",
              "alias_name": "alias_name_1"
            }
          },
          "status": 400
        },
        {
          "errormessage": "Invalid syncMode: undefined. Supported sync modes are 'add' and 'update'.",
          "errorreporter": "DESTINATION",
          "errortype": "BAD_REQUEST",
          "sent": {
            "batch_size": 75,
            "cancel_reason": "I didn't like it",
            "cart_id": "cart_id_1",
            "checkout_id": "checkout_id_1",
            "currency": "USD",
            "discounts": [
              { "amount": 5, "code": "SUMMER21" },
              { "amount": 5, "code": "VIPCUSTOMER" }
            ],
            "enable_batching": true,
            "metadata": {
              "checkout_url": "https://example.com/checkout",
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": ["a", "b", "c"],
              "custom_field_5": { "nested_key": "nested_value" },
              "order_status_url": "https://example.com/order/status"
            },
            "name": "ecommerce.order_placed",
            "order_id": "order_id_1",
            "products": [
              {
                "color": "red",
                "image_url": "https://example.com/prod1.jpg",
                "price": 25,
                "product_id": "prod_1",
                "product_name": "Product 1",
                "quantity": 2,
                "size": "M",
                "variant_id": "Size M"
              },
              {
                "image_url": "https://example.com/prod2.jpg",
                "price": 50,
                "product_id": "prod_2",
                "product_name": "Product 2",
                "quantity": 1,
                "variant_id": "Size L"
              }
            ],
            "source": "test_source",
            "time": "2024-06-10T12:00:00.000Z",
            "total_discounts": 10,
            "total_value": 100
          },
          "status": 400
        },
        {
          "errormessage": "Invalid syncMode: undefined. Supported sync modes are 'add' and 'update'.",
          "errorreporter": "DESTINATION",
          "errortype": "BAD_REQUEST",
          "sent": {
            "batch_size": 75,
            "braze_id": "braze_id_1",
            "cancel_reason": "I didn't like it",
            "cart_id": "cart_id_1",
            "checkout_id": "checkout_id_1",
            "currency": "USD",
            "discounts": [
              { "amount": 5, "code": "SUMMER21" },
              { "amount": 5, "code": "VIPCUSTOMER" }
            ],
            "email": "email@email.com",
            "enable_batching": true,
            "external_id": "userId3",
            "metadata": {
              "checkout_url": "https://example.com/checkout",
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": ["a", "b", "c"],
              "custom_field_5": { "nested_key": "nested_value" },
              "order_status_url": "https://example.com/order/status"
            },
            "name": "ecommerce.checkout_started",
            "order_id": "order_id_1",
            "phone": "+14155551234",
            "products": [
              {
                "color": "red",
                "image_url": "https://example.com/prod1.jpg",
                "price": 25,
                "product_id": "prod_1",
                "product_name": "Product 1",
                "quantity": 2,
                "size": "M",
                "variant_id": "Size M"
              },
              {
                "image_url": "https://example.com/prod2.jpg",
                "price": 50,
                "product_id": "prod_2",
                "product_name": "Product 2",
                "quantity": 1,
                "variant_id": "Size L"
              }
            ],
            "source": "test_source",
            "time": "2024-06-10T12:00:00.000Z",
            "total_discounts": 10,
            "total_value": 100,
            "user_alias": {
              "alias_label": "alias_label_1",
              "alias_name": "alias_name_1"
            }
          },
          "status": 400
        },
        {
          "errormessage": "Invalid syncMode: undefined. Supported sync modes are 'add' and 'update'.",
          "errorreporter": "DESTINATION",
          "errortype": "BAD_REQUEST",
          "sent": {
            "batch_size": 75,
            "braze_id": "braze_id_1",
            "cancel_reason": "I didn't like it",
            "cart_id": "cart_id_1",
            "checkout_id": "checkout_id_1",
            "currency": "USD",
            "discounts": [
              { "amount": 5, "code": "SUMMER21" },
              { "amount": 5, "code": "VIPCUSTOMER" }
            ],
            "email": "email@email.com",
            "enable_batching": true,
            "external_id": "userId4",
            "metadata": {
              "checkout_url": "https://example.com/checkout",
              "custom_field_1": "custom_value_1",
              "custom_field_2": 100,
              "custom_field_3": true,
              "custom_field_4": ["a", "b", "c"],
              "custom_field_5": { "nested_key": "nested_value" },
              "order_status_url": "https://example.com/order/status"
            },
            "name": "ecommerce.order_cancelled",
            "order_id": "order_id_1",
            "phone": "+14155551234",
            "products": [
              {
                "color": "red",
                "image_url": "https://example.com/prod1.jpg",
                "price": 25,
                "product_id": "prod_1",
                "product_name": "Product 1",
                "quantity": 2,
                "size": "M",
                "variant_id": "Size M"
              },
              {
                "image_url": "https://example.com/prod2.jpg",
                "price": 50,
                "product_id": "prod_2",
                "product_name": "Product 2",
                "quantity": 1,
                "variant_id": "Size L"
              }
            ],
            "source": "test_source",
            "time": "2024-06-10T12:00:00.000Z",
            "total_discounts": 10,
            "total_value": 100,
            "user_alias": {
              "alias_label": "alias_label_1",
              "alias_name": "alias_name_1"
            }
          },
          "status": 400
        }
      ]
      
      nock(settings.endpoint)
        .post('/users/track', json)
        .reply(200)

      const response = await testDestination.executeBatch('ecommerce', {
        events,
        settings,
        mapping: mapping2
      })

      expect(response).toEqual(responseJSON)
    })
  })
})
