import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'

describe('GA4', () => {
  describe('Purchase', () => {
    it('should append user_properties correctly', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"EUR\\",\\"items\\":[{\\"item_name\\":\\"Tour t-shirt\\",\\"item_id\\":\\"pid-123456\\",\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"value\\":5.99,\\"engagement_time_msec\\":2}}]}"`
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"eur\\",\\"items\\":[{\\"item_name\\":\\"Tour t-shirt\\",\\"item_id\\":\\"pid-123456\\",\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"value\\":5.99,\\"engagement_time_msec\\":2}}]}"`
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
            transaction_id: {
              '@path': '$.properties.order_id'
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

    it('should throw error when product name and id are missing', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
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
            apiSecret
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
            ]
          },
          useDefaultMappings: false
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"purchase\\",\\"params\\":{\\"affiliation\\":\\"TI Online Store\\",\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"EUR\\",\\"items\\":[{\\"item_id\\":\\"pid-123456\\",\\"item_name\\":\\"Tour t-shirt\\",\\"coupon\\":\\"MOUNTAIN\\",\\"item_brand\\":\\"Canvas\\",\\"item_category\\":\\"T-Shirt\\",\\"item_variant\\":\\"Black\\",\\"price\\":19.98,\\"quantity\\":2}],\\"transaction_id\\":\\"5678dd9087-78\\",\\"shipping\\":1.5,\\"value\\":24.48,\\"tax\\":3,\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
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
        expect(e.message).toBe(
          'Param [hello] has unsupported value of type [Array]. GA4 does not accept array or object values for user properties.'
        )
      }
    })
  })
})
