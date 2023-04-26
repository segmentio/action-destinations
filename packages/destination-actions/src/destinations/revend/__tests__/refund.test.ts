import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'

describe('GA4', () => {
  describe('Order Refunded', () => {
    it('should append user_properties correctly', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
          apiSecret
        },
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
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
          apiSecret
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
            "token": Array [
              "b287432uhkjHIUEL",
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
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
          apiSecret
        },
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
            "token": Array [
              "b287432uhkjHIUEL",
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
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
          apiSecret
        },
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
            "token": Array [
              "b287432uhkjHIUEL",
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
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
            apiSecret
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
        expect(e.message).toBe('Currency is required if value is set.')
      }
    })

    it('should throw an error for an item with neither item_id or item_name', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
            apiSecret
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
        expect(e.message).toBe('One of item-level currency or top-level currency is required.')
      }
    })

    it('should throw an error when no currency is included', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
            apiSecret
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
        expect(e.message).toBe('One of item-level currency or top-level currency is required.')
      }
    })

    it('should throw an error when params value is null', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
            apiSecret
          },
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
        expect(e.message).toBe(
          'Param [test_value] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.'
        )
      }
    })

    it('should throw an error when user_properties value is array', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
            apiSecret
          },
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
        expect(e.message).toBe(
          'Param [hello] has unsupported value of type [Array]. GA4 does not accept array or object values for user properties.'
        )
      }
    })
  })
})
