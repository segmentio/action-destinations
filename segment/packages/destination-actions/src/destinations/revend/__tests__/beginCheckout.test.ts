import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'

describe('GA4', () => {
  describe('Begin Checkout', () => {
    it('should append user_properties correctly', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})

      const event = createTestEvent({
        event: 'Checkout Started',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1,
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('beginCheckout', {
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
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_category: {
                '@path': `$.properties.products.0.category`
              }
            }
          ]
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"begin_checkout\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\"}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
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
        event: 'Checkout Started',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
          revenue: 25.0,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('beginCheckout', {
        event,
        settings: {
          apiSecret
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
          value: {
            '@path': '$.properties.revenue'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_category: {
                '@path': `$.properties.products.0.category`
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"begin_checkout\\",\\"params\\":{\\"coupon\\":\\"hasbros\\",\\"currency\\":\\"USD\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\"}],\\"value\\":25,\\"engagement_time_msec\\":2}}]}"`
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
        event: 'Checkout Started',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
          revenue: 25.0,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'usd',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('beginCheckout', {
        event,
        settings: {
          apiSecret
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
          value: {
            '@path': '$.properties.revenue'
          },
          items: [
            {
              item_name: {
                '@path': `$.properties.products.0.name`
              },
              item_category: {
                '@path': `$.properties.products.0.category`
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"begin_checkout\\",\\"params\\":{\\"coupon\\":\\"hasbros\\",\\"currency\\":\\"usd\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\"}],\\"value\\":25,\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should throw an error for invalid currency values', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Checkout Started',
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
        await testDestination.testAction('beginCheckout', {
          event,
          settings: {
            apiSecret
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
            items: {
              item_name: {
                '@path': '$.properties.name'
              }
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('1234 is not a valid currency code.')
      }
    })

    it('should throw an error for products missing name and id', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Checkout Started',
        userId: '3456fff',
        type: 'track',
        properties: {
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'USD',
          products: [
            {
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ]
        }
      })
      try {
        await testDestination.testAction('beginCheckout', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            items: [
              {
                item_brand: {
                  '@path': `$.properties.brand`
                }
              }
            ]
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('One of product name or product id is required for product or impression data.')
      }
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
        event: 'Checkout Started',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          order_id: '50314b8e9bcf000000000000',
          affiliation: 'Google Store',
          value: 30,
          revenue: 25.0,
          shipping: 3,
          tax: 2,
          discount: 2.5,
          coupon: 'hasbros',
          currency: 'USD',
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('beginCheckout', {
        event,
        settings: {
          apiSecret
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"begin_checkout\\",\\"params\\":{\\"coupon\\":\\"hasbros\\",\\"currency\\":\\"USD\\",\\"items\\":[{\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\",\\"price\\":19,\\"quantity\\":1}],\\"value\\":30,\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw an error when param value is null', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})
      const event = createTestEvent({
        event: 'Checkout Started',
        userId: '3456fff',
        type: 'track',
        properties: {
          order_id: '5678dd9087-78',
          coupon: 'SUMMER_FEST',
          currency: 'USD',
          products: [
            {
              name: 'test',
              quantity: 2,
              coupon: 'MOUNTAIN',
              brand: 'Canvas',
              category: 'T-Shirt',
              variant: 'Black',
              price: 19.98
            }
          ]
        }
      })
      try {
        await testDestination.testAction('beginCheckout', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
            },
            currency: {
              '@path': '$.properties.currency'
            },
            value: {
              '@path': '$.properties.value'
            },
            items: [
              {
                item_brand: {
                  '@path': `$.properties.brand`
                },
                item_name: {
                  '@path': '$.properties.products.0.name'
                }
              }
            ],
            params: {
              test_key: null
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe(
          'Param [test_key] has unsupported value of type [NULL]. GA4 does not accept null, array, or object values for event parameters and item parameters.'
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
        event: 'Checkout Started',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1,
          products: [
            {
              product_id: '507f1f77bcf86cd799439011',
              sku: '45790-32',
              name: 'Monopoly: 3rd Edition',
              price: 19,
              quantity: 1,
              category: 'Games',
              url: 'https://www.example.com/product/path',
              image_url: 'https://www.example.com/product/path.jpg'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('beginCheckout', {
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
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.products.0.name`
                },
                item_category: {
                  '@path': `$.properties.products.0.category`
                }
              }
            ]
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
