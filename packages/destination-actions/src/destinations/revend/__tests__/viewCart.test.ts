import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'

describe('GA4', () => {
  describe('View Cart', () => {
    it('should append user_properties correctly', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})

      const event = createTestEvent({
        event: 'Cart Viewed',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          currency: 'USD',
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              currency: 'USD',
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('viewCart', {
        event,
        settings: {
          apiSecret
        },
        mapping: {
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"view_cart\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"items\\":[{\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\",\\"price\\":19,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
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
        event: 'Cart Viewed',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
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
      const responses = await testDestination.testAction('viewCart', {
        event,
        settings: {
          apiSecret
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          timestamp_micros: {
            '@path': '$.timestamp'
          },
          engagement_time_msec: 2,
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"view_cart\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"USD\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
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
        event: 'Cart Viewed',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          products: [
            {
              product_id: '12345abcde',
              name: 'Quadruple Stack Oreos, 52 ct',
              currency: 'usd',
              price: 12.99,
              quantity: 1
            }
          ]
        }
      })
      const responses = await testDestination.testAction('viewCart', {
        event,
        settings: {
          apiSecret
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          engagement_time_msec: 2,
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"view_cart\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"usd\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should throw an error when no items array is included', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})

      const event = createTestEvent({
        event: 'Cart Viewed',
        userId: '1234abc',
        type: 'track',
        properties: {
          currency: 'USD',
          price: 10
        }
      })
      try {
        await testDestination.testAction('viewCart', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.price'
            }
          },
          useDefaultMappings: false
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe("The root value is missing the required field 'items'.")
      }
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
        event: 'Cart Viewed',
        userId: 'abc123',
        type: 'track',
        properties: {
          value: 42,
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
        await testDestination.testAction('viewCart', {
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

    it('should throw an error when no currency is included', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})

      const event = createTestEvent({
        event: 'Cart Viewed',
        userId: 'abc123',
        type: 'track',
        properties: {
          products: [
            {
              product_id: '123456'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('viewCart', {
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
          useDefaultMappings: false
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
        event: 'Cart Viewed',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          currency: 'USD',
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              currency: 'USD',
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('viewCart', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
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
        event: 'Cart Viewed',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          currency: 'USD',
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              currency: 'USD',
              category: 'Games',
              promotion: 'SUPER SUMMER SALE; 3% off',
              slot: '2',
              promo_id: '12345',
              creative_name: 'Sale'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('viewCart', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
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
