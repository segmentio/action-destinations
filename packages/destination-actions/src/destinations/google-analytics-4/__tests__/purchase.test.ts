import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'
import { DataStreamType } from '../ga4-types'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'
const firebaseAppId = '2:925731738562:android:a9c393108115c5581abc5b'

const testEvent = createTestEvent({
  event: 'Order Completed',
  userId: 'abc123',
  timestamp: '2022-06-22T22:20:58.905Z',
  anonymousId: 'anon-2134',
  type: 'track',
  properties: {
    affiliation: 'TI Online Store',
    order_number: '5678dd9087-78',
    coupon: 'SUMMER_FEST',
    currency: 'EUR',
    products: [
      {
        product_id: 'pid-123456',
        sku: 'SKU-123456',
        name: 'Tour t-shirt',
        quantity: 2,
        coupon: 'MOUNTAIN',
        brand: 'Canvas',
        category: 'T-Shirt',
        variant: 'Black',
        price: 19.98
      }
    ],
    revenue: 5.99,
    shipping: 1.5,
    tax: 3.0,
    total: 24.48
  }
})
describe('GA4', () => {
  describe('Purchase', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Completed',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_number: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'EUR',
          products: [
            {
              product_id: 'pid-123456',
              sku: 'SKU-123456',
              name: 'Tour t-shirt',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })
      const responses = await testDestination.testAction('purchase', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          transaction_id: {
            '@path': '$.properties.order_number'
          },
          client_id: {
            '@path': '$.anonymousId'
          },
          user_properties: {
            hello: 'world',
            a: '1',
            b: '2',
            c: '3'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              quantity: {
                '@path': `$.properties.products.0.quantity`
              },
              coupon: {
                '@path': `$.properties.products.0.coupon`
              },
              item_brand: {
                '@path': `$.properties.products.0.brand`
              },
              item_category: {
                '@path': `$.properties.products.0.category`
              },
              item_variant: {
                '@path': `$.properties.products.0.variant`
              },
              price: {
                '@path': `$.properties.products.0.price`
              }
            }
          ]
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"affiliation\\":\\"TI Online Store\\",\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"EUR\\",\\"items\\":[{\\"item_name\\":\\"Tour t-shirt\\",\\"item_id\\":\\"pid-123456\\",\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"shipping\\":1.5,\\"value\\":24.48,\\"tax\\":3,\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'EUR',
          products: [
            {
              product_id: 'pid-123456',
              sku: 'SKU-123456',
              name: 'Tour t-shirt',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })
      const responses = await testDestination.testAction('purchase', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          engagement_time_msec: 2,
          coupon: {
            '@path': '$.properties.coupon'
          },
          currency: {
            '@path': '$.properties.currency'
          },
          transaction_id: {
            '@path': '$.properties.order_id'
          },
          value: {
            '@path': '$.properties.revenue'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              quantity: {
                '@path': `$.properties.products.0.quantity`
              },
              coupon: {
                '@path': `$.properties.products.0.coupon`
              },
              item_brand: {
                '@path': `$.properties.products.0.brand`
              },
              item_category: {
                '@path': `$.properties.products.0.category`
              },
              item_variant: {
                '@path': `$.properties.products.0.variant`
              },
              price: {
                '@path': `$.properties.products.0.price`
              }
            }
          ]
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"EUR\\",\\"items\\":[{\\"item_name\\":\\"Tour t-shirt\\",\\"item_id\\":\\"pid-123456\\",\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"value\\":5.99,\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should allow currency to be lowercase', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'eur',
          products: [
            {
              product_id: 'pid-123456',
              sku: 'SKU-123456',
              name: 'Tour t-shirt',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })
      const responses = await testDestination.testAction('purchase', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          engagement_time_msec: 2,
          coupon: {
            '@path': '$.properties.coupon'
          },
          currency: {
            '@path': '$.properties.currency'
          },
          transaction_id: {
            '@path': '$.properties.order_id'
          },
          value: {
            '@path': '$.properties.revenue'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              quantity: {
                '@path': `$.properties.products.0.quantity`
              },
              coupon: {
                '@path': `$.properties.products.0.coupon`
              },
              item_brand: {
                '@path': `$.properties.products.0.brand`
              },
              item_category: {
                '@path': `$.properties.products.0.category`
              },
              item_variant: {
                '@path': `$.properties.products.0.variant`
              },
              price: {
                '@path': `$.properties.products.0.price`
              }
            }
          ],
          data_stream_type: DataStreamType.Web
        },
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"eur\\",\\"items\\":[{\\"item_name\\":\\"Tour t-shirt\\",\\"item_id\\":\\"pid-123456\\",\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"value\\":5.99,\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should throw an error for invalid currency values', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '3456fff',
        type: 'track',
        properties: {
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: '1234',
          name: 'A product'
        }
      })
      try {
        await testDestination.testAction('purchase', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            coupon: {
              '@path': '$.properties.coupon'
            },
            currency: {
              '@path': '$.properties.currency'
            },
            transaction_id: {
              '@path': '$.properties.order_id'
            },
            items: {
              item_name: {
                '@path': '$.properties.name'
              }
            },
            data_stream_type: DataStreamType.Web
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe('1234 is not a valid currency code.')
      }
    })

    it('should throw error when product name and id are missing', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'EUR',
          products: [
            {
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })

      try {
        await testDestination.testAction('purchase', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            coupon: {
              '@path': '$.properties.coupon'
            },
            currency: {
              '@path': '$.properties.currency'
            },
            transaction_id: {
              '@path': '$.properties.order_id'
            },
            value: {
              '@path': '$.properties.revenue'
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_id: {
                  '@path': `$.properties.products.0.product_id`
                },
                quantity: {
                  '@path': `$.properties.products.0.quantity`
                },
                coupon: {
                  '@path': `$.properties.products.0.coupon`
                },
                item_brand: {
                  '@path': `$.properties.products.0.brand`
                },
                item_category: {
                  '@path': `$.properties.products.0.category`
                },
                item_variant: {
                  '@path': `$.properties.products.0.variant`
                },
                price: {
                  '@path': `$.properties.products.0.price`
                }
              }
            ],
            data_stream_type: DataStreamType.Web
          },
          useDefaultMappings: false
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'One of product name or product id is required for product or impression data.'
        )
      }
    })

    it('should handle default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'EUR',
          products: [
            {
              product_id: 'pid-123456',
              sku: 'SKU-123456',
              name: 'Tour t-shirt',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })
      const responses = await testDestination.testAction('purchase', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"affiliation\\":\\"TI Online Store\\",\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"EUR\\",\\"items\\":[{\\"item_id\\":\\"pid-123456\\",\\"item_name\\":\\"Tour t-shirt\\",\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98,\\"quantity\\":2}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"shipping\\":1.5,\\"value\\":24.48,\\"tax\\":3,\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw an error when param value is null', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Completed',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_number: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'EUR',
          products: [
            {
              product_id: 'pid-123456',
              sku: 'SKU-123456',
              name: 'Tour t-shirt',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })
      try {
        await testDestination.testAction('purchase', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          features: { 'actions-google-analytics-4-verify-params-feature': true },
          mapping: {
            transaction_id: {
              '@path': '$.properties.order_number'
            },
            client_id: {
              '@path': '$.anonymousId'
            },
            params: {
              test_value: null
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_id: {
                  '@path': `$.properties.products.0.product_id`
                },
                quantity: {
                  '@path': `$.properties.products.0.quantity`
                },
                coupon: {
                  '@path': `$.properties.products.0.coupon`
                },
                item_brand: {
                  '@path': `$.properties.products.0.brand`
                },
                item_category: {
                  '@path': `$.properties.products.0.category`
                },
                item_variant: {
                  '@path': `$.properties.products.0.variant`
                },
                price: {
                  '@path': `$.properties.products.0.price`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Param [test_value] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.'
        )
      }
    })

    it('should throw an error when user_properties value is array', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Completed',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          affiliation: 'TI Online Store',
          order_number: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'EUR',
          products: [
            {
              product_id: 'pid-123456',
              sku: 'SKU-123456',
              name: 'Tour t-shirt',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ],
          revenue: 5.99,
          shipping: 1.5,
          tax: 3.0,
          total: 24.48
        }
      })
      try {
        await testDestination.testAction('purchase', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          features: { 'actions-google-analytics-4-verify-params-feature': true },
          mapping: {
            transaction_id: {
              '@path': '$.properties.order_number'
            },
            client_id: {
              '@path': '$.anonymousId'
            },
            user_properties: {
              hello: ['World', 'world'],
              a: '1',
              b: '2',
              c: '3'
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_id: {
                  '@path': `$.properties.products.0.product_id`
                },
                quantity: {
                  '@path': `$.properties.products.0.quantity`
                },
                coupon: {
                  '@path': `$.properties.products.0.coupon`
                },
                item_brand: {
                  '@path': `$.properties.products.0.brand`
                },
                item_category: {
                  '@path': `$.properties.products.0.category`
                },
                item_variant: {
                  '@path': `$.properties.products.0.variant`
                },
                price: {
                  '@path': `$.properties.products.0.price`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe(
          'Param [hello] has unsupported value of type [Array]. GA4 does not accept array or object values for user properties.'
        )
      }
    })

    it('should use mobile stream params when datastream is mobile app', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?api_secret=${apiSecret}&firebase_app_id=${firebaseAppId}`, {
          app_instance_id: 'anon-2134',
          events: [
            {
              name: 'purchase',
              params: {
                affiliation: 'TI Online Store',
                coupon: 'SUMMER_FEST',
                currency: 'EUR',
                items: [
                  {
                    item_id: 'pid-123456',
                    item_name: 'Tour t-shirt',
                    coupon: 'MOUNTAIN',
                    item_brand: 'Canvas',
                    item_category: 'T-Shirt',
                    item_variant: 'Black',
                    price: 19.98,
                    quantity: 2
                  }
                ],
                transaction_id: '5678dd9087-78',
                shipping: 1.5,
                value: 24.48,
                tax: 3,
                engagement_time_msec: 1
              }
            }
          ]
        })
        .reply(201, {})

      await expect(
        testDestination.testAction('purchase', {
          event: testEvent,
          settings: {
            apiSecret,
            firebaseAppId
          },
          mapping: {
            data_stream_type: DataStreamType.MobileApp,
            app_instance_id: {
              '@path': '$.anonymousId'
            },
            transaction_id: {
              '@path': '$.properties.order_number'
            }
          },
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should throw error when data stream type is mobile app and firebase_app_id is not provided', async () => {
      await expect(
        testDestination.testAction('purchase', {
          event: testEvent,
          settings: {
            apiSecret
          },
          mapping: {
            data_stream_type: DataStreamType.MobileApp,
            app_instance_id: {
              '@path': '$.anonymousId'
            },
            transaction_id: {
              '@path': '$.properties.order_number'
            }
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Firebase App ID is required for mobile app streams')
    })

    it('should throw error when data stream type is mobile app and app_instance_id is not provided', async () => {
      await expect(
        testDestination.testAction('purchase', {
          event: testEvent,
          settings: {
            apiSecret,
            firebaseAppId
          },
          mapping: {
            data_stream_type: DataStreamType.MobileApp,
            transaction_id: {
              '@path': '$.properties.order_number'
            }
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Firebase App Instance ID is required for mobile app streams')
    })

    it('should throw error when data stream type is web and measurement_id is not provided', async () => {
      await expect(
        testDestination.testAction('purchase', {
          event: testEvent,
          settings: {
            apiSecret
          },
          mapping: {
            transaction_id: {
              '@path': '$.properties.order_number'
            }
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Measurement ID is required for web streams')
    })

    it('should throw error when data stream type is web and client_id is not provided', async () => {
      await expect(
        testDestination.testAction('purchase', {
          event: testEvent,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.traits.dummy'
            },
            transaction_id: {
              '@path': '$.properties.order_number'
            }
          },
          useDefaultMappings: true
        })
      ).rejects.toThrowError('Client ID is required for web streams')
    })
  })
})
