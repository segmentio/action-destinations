import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'
import { DataStreamType } from '../ga4-types'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'
const firebaseAppId = '2:925731738562:android:a9c393108115c5581abc5b'

const testEvent = createTestEvent({
  event: 'Order Refunded',
  userId: 'abc123',
  timestamp: '2022-06-22T22:20:58.905Z',
  anonymousId: 'anon-2134',
  type: 'track',
  properties: {
    order_number: '12345abcde',
    name: 'Quadruple Stack Oreos, 52 ct',
    currency: 'USD',
    price: 12.99,
    quantity: 1
  }
})
describe('GA4', () => {
  describe('Order Refunded', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          order_number: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      const responses = await testDestination.testAction('refund', {
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
          }
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"refund\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"transaction_id\\":\\"12345abcde\\",\\"items\\":[],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          order_number: 'c1209123',
          products: [
            {
              product_id: '12345abcde',
              name: 'Quadruple Stack Oreos, 52 ct',
              currency: 'USD',
              price: 12.99,
              quantity: 1
            }
          ]
        }
      })
      const responses = await testDestination.testAction('refund', {
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
          transaction_id: {
            '@path': '$.properties.order_number'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              },
              currency: {
                '@path': `$.properties.products.0.currency`
              },
              price: {
                '@path': `$.properties.products.0.price`
              },
              quantity: {
                '@path': `$.properties.products.0.quantity`
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"refund\\",\\"params\\":{\\"transaction_id\\":\\"c1209123\\",\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"USD\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should handle default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: '1234abc',
        timestamp: '2022-06-22T22:20:58.905Z',
        type: 'track',
        properties: {
          currency: 'USD',
          value: 10,
          coupon: 'SUMMER_FUN',
          order_id: 'c1209123',
          products: [
            {
              product_id: '12345',
              name: 'Monopoly: 3rd Edition',
              currency: 'USD'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('refund', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          coupon: {
            '@path': '$.properties.coupon'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              }
            }
          ]
        },
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
        `"{\\"client_id\\":\\"1234abc\\",\\"events\\":[{\\"name\\":\\"refund\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"transaction_id\\":\\"c1209123\\",\\"value\\":10,\\"coupon\\":\\"SUMMER_FUN\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"12345\\"}],\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should allow currency to be lowercase', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: '1234abc',
        timestamp: '2022-06-22T22:20:58.905Z',
        type: 'track',
        properties: {
          currency: 'usd',
          value: 10,
          coupon: 'SUMMER_FUN',
          order_id: 'c1209123',
          products: [
            {
              product_id: '12345',
              name: 'Monopoly: 3rd Edition',
              currency: 'usd'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('refund', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
        mapping: {
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          coupon: {
            '@path': '$.properties.coupon'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_id: {
                '@path': `$.properties.products.0.product_id`
              }
            }
          ]
        },
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
        `"{\\"client_id\\":\\"1234abc\\",\\"events\\":[{\\"name\\":\\"refund\\",\\"params\\":{\\"currency\\":\\"usd\\",\\"transaction_id\\":\\"c1209123\\",\\"value\\":10,\\"coupon\\":\\"SUMMER_FUN\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"12345\\"}],\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw an error when a value is included with no currency', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: 'abc123',
        type: 'track',
        properties: {
          value: 42,
          order_id: 'c1209123',
          products: [
            {
              product_id: '12345',
              name: 'Monopoly: 3rd Edition',
              currency: 'USD'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('refund', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            value: {
              '@path': '$.properties.value'
            },
            items: [
              {
                item_id: {
                  '@path': '$.properties.product_id'
                },
                item_name: {
                  '@path': '$.properties.name'
                },
                currency: {
                  '@path': '$.properties.currency'
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe('Currency is required if value is set.')
      }
    })

    it('should throw an error for an item with neither item_id or item_name', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: 'abc123',
        type: 'track',
        properties: {
          order_id: 'c1209123',
          products: [
            {
              coupon: 'SUMMER_FUN'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('refund', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            items: [
              {
                coupon: {
                  '@path': '$.properties.products.0.coupon'
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe('One of item-level currency or top-level currency is required.')
      }
    })

    it('should throw an error when no currency is included', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: 'abc123',
        type: 'track',
        properties: {
          order_id: 'c1209123',
          products: [
            {
              product_id: '123456'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('refund', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            items: [
              {
                item_id: {
                  '@path': '$.properties.products.0.product_id'
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect((e as Error).message).toBe('One of item-level currency or top-level currency is required.')
      }
    })

    it('should throw an error when params value is null', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Order Refunded',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          order_number: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('refund', {
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
            }
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
        event: 'Order Refunded',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          order_number: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('refund', {
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
            }
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
              name: 'refund',
              params: { currency: 'USD', transaction_id: '12345abcde', items: [], engagement_time_msec: 1 }
            }
          ]
        })
        .reply(201, {})

      await expect(
        testDestination.testAction('refund', {
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
        testDestination.testAction('refund', {
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
        testDestination.testAction('refund', {
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
        testDestination.testAction('refund', {
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
        testDestination.testAction('refund', {
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
