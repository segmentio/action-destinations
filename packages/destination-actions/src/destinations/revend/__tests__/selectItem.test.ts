import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'

describe('GA4', () => {
  describe('Select Item', () => {
    it('should append user_properties correctly', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})

      const event = createTestEvent({
        event: 'Select Item',
        userId: 'abc123',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      const responses = await testDestination.testAction('selectItem', {
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"select_item\\",\\"params\\":{\\"items\\":[{\\"item_id\\":\\"12345abcde\\",\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
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
        event: 'Product Clicked',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          product_id: '507f1f77bcf86cd799439011',
          sku: 'G-32',
          category: 'Games',
          name: 'Monopoly: 3rd Edition',
          brand: 'Hasbro',
          variant: '200 pieces',
          price: 18.99,
          quantity: 1,
          coupon: 'MAYDEALS',
          position: 3,
          url: 'https://www.example.com/product/path',
          image_url: 'https://www.example.com/product/path.jpg'
        }
      })
      const responses = await testDestination.testAction('selectItem', {
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
              item_id: {
                '@path': `$.properties.product_id`
              },
              item_name: {
                '@path': `$.properties.name`
              },
              item_category: {
                '@path': `$.properties.category`
              },
              quantity: {
                '@path': `$.properties.quantity`
              },
              coupon: {
                '@path': `$.properties.coupon`
              },
              index: {
                '@path': `$.properties.position`
              },
              item_brand: {
                '@path': `$.properties.brand`
              },
              item_variant: {
                '@path': `$.properties.variant`
              },
              price: {
                '@path': `$.properties.price`
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"select_item\\",\\"params\\":{\\"items\\":[{\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\",\\"quantity\\":1,\\"coupon\\":\\"MAYDEALS\\",\\"index\\":3,\\"item_brand\\":\\"Hasbro\\",\\"item_variant\\":\\"200 pieces\\",\\"price\\":18.99}],\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
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
        event: 'Product Clicked',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          product_id: '507f1f77bcf86cd799439011',
          sku: 'G-32',
          category: 'Games',
          name: 'Monopoly: 3rd Edition',
          brand: 'Hasbro',
          variant: '200 pieces',
          price: 18.99,
          currency: 'usd',
          quantity: 1,
          coupon: 'MAYDEALS',
          position: 3,
          url: 'https://www.example.com/product/path',
          image_url: 'https://www.example.com/product/path.jpg'
        }
      })
      const responses = await testDestination.testAction('selectItem', {
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
              item_id: {
                '@path': `$.properties.product_id`
              },
              item_name: {
                '@path': `$.properties.name`
              },
              item_category: {
                '@path': `$.properties.category`
              },
              quantity: {
                '@path': `$.properties.quantity`
              },
              coupon: {
                '@path': `$.properties.coupon`
              },
              index: {
                '@path': `$.properties.position`
              },
              item_brand: {
                '@path': `$.properties.brand`
              },
              item_variant: {
                '@path': `$.properties.variant`
              },
              price: {
                '@path': `$.properties.price`
              },
              currency: {
                '@path': `$.properties.currency`
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
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"select_item\\",\\"params\\":{\\"items\\":[{\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_category\\":\\"Games\\",\\"quantity\\":1,\\"coupon\\":\\"MAYDEALS\\",\\"index\\":3,\\"item_brand\\":\\"Hasbro\\",\\"item_variant\\":\\"200 pieces\\",\\"price\\":18.99,\\"currency\\":\\"usd\\"}],\\"engagement_time_msec\\":2}}],\\"timestamp_micros\\":1655936458905000}"`
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
        event: 'Product Clicked',
        userId: '3456fff',
        timestamp: '2022-06-22T22:20:58.905Z',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          product_id: '5678fkj9087',
          sku: 'U-567890',
          category: 'Clothing',
          name: 'Limited Edition T',
          brand: 'yeezy',
          variant: 'Black',
          price: 8.99,
          quantity: 1,
          coupon: 'SummerFest',
          position: 30,
          url: 'https://www.example.com/product/path',
          image_url: 'https://www.example.com/product/path.jpg'
        }
      })
      const responses = await testDestination.testAction('selectItem', {
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"select_item\\",\\"params\\":{\\"items\\":[{\\"item_id\\":\\"5678fkj9087\\",\\"item_name\\":\\"Limited Edition T\\",\\"coupon\\":\\"SummerFest\\",\\"item_brand\\":\\"yeezy\\",\\"item_category\\":\\"Clothing\\",\\"item_variant\\":\\"Black\\",\\"price\\":8.99,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
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
        event: 'Product Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          product_id: '5678fkj9087',
          sku: 'U-567890',
          category: 'Clothing',
          name: 'Limited Edition T',
          brand: 'yeezy',
          variant: 'Black',
          price: 8.99,
          quantity: 1,
          coupon: 'SummerFest',
          position: 30,
          url: 'https://www.example.com/product/path',
          image_url: 'https://www.example.com/product/path.jpg'
        }
      })
      try {
        await testDestination.testAction('selectItem', {
          event,
          settings: {
            apiSecret
          },
          mapping: {
            client_id: {
              '@path': '$.anonymousId'
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

    it('should throw an error when params value is null', async () => {
      nock('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app', {
        reqheaders: {
          token: apiSecret
        }
      })
        .post('/v2/consolidated-data')
        .reply(201, {})

      const event = createTestEvent({
        event: 'Select Item',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('selectItem', {
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
        event: 'Select Item',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          product_id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      try {
        await testDestination.testAction('selectItem', {
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
