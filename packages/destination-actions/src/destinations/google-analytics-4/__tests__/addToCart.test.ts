import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Add to Cart', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Product Added',
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
      const responses = await testDestination.testAction('addToCart', {
        event,
        settings: {
          apiSecret,
          measurementId
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"add_to_cart\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"items\\":[{\\"item_id\\":\\"12345abcde\\",\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}}}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Product Added',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          cart_id: 'skdjsidjsdkdj29j',
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
      const responses = await testDestination.testAction('addToCart', {
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
          value: {
            '@path': '$.properties.price'
          },
          engagement_time_msec: 2,
          items: [
            {
              item_name: {
                '@path': `$.properties.name`
              },
              item_id: {
                '@path': `$.properties.product_id`
              },
              quantity: {
                '@path': `$.properties.quantity`
              },
              coupon: {
                '@path': `$.properties.coupon`
              },
              item_brand: {
                '@path': `$.properties..brand`
              },
              item_category: {
                '@path': `$.properties.category`
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
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"add_to_cart\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"quantity\\":1,\\"coupon\\":\\"MAYDEALS\\",\\"item_brand\\":\\"Hasbro\\",\\"item_category\\":\\"Games\\",\\"item_variant\\":\\"200 pieces\\",\\"price\\":18.99}],\\"value\\":18.99,\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should allow for currency to be lowercase', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Product Added',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          cart_id: 'skdjsidjsdkdj29j',
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
      const responses = await testDestination.testAction('addToCart', {
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
          value: {
            '@path': '$.properties.price'
          },
          engagement_time_msec: 2,
          items: [
            {
              item_name: {
                '@path': `$.properties.name`
              },
              item_id: {
                '@path': `$.properties.product_id`
              },
              quantity: {
                '@path': `$.properties.quantity`
              },
              coupon: {
                '@path': `$.properties.coupon`
              },
              item_brand: {
                '@path': `$.properties..brand`
              },
              item_category: {
                '@path': `$.properties.category`
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
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"add_to_cart\\",\\"params\\":{\\"currency\\":\\"usd\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"quantity\\":1,\\"coupon\\":\\"MAYDEALS\\",\\"item_brand\\":\\"Hasbro\\",\\"item_category\\":\\"Games\\",\\"item_variant\\":\\"200 pieces\\",\\"price\\":18.99,\\"currency\\":\\"usd\\"}],\\"value\\":18.99,\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should throw an error when product name and id are missing', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Product Added',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          category: 'Games',
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

      try {
        await testDestination.testAction('addToCart', {
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
            value: {
              '@path': '$.properties.price'
            },
            items: [
              {
                item_name: {
                  '@path': `$.properties.name`
                },
                item_id: {
                  '@path': `$.properties.product_id`
                },
                quantity: {
                  '@path': `$.properties.quantity`
                },
                coupon: {
                  '@path': `$.properties.coupon`
                },
                item_brand: {
                  '@path': `$.properties..brand`
                },
                item_category: {
                  '@path': `$.properties.category`
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
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('One of product name or product id is required for product or impression data.')
      }
    })

    it('should handle default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Product Added',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          cart_id: 'skdjsidjsdkdj29j',
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
      const responses = await testDestination.testAction('addToCart', {
        event,
        settings: {
          apiSecret,
          measurementId
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
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"add_to_cart\\",\\"params\\":{\\"items\\":[{\\"item_id\\":\\"507f1f77bcf86cd799439011\\",\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"coupon\\":\\"MAYDEALS\\",\\"item_brand\\":\\"Hasbro\\",\\"item_category\\":\\"Games\\",\\"item_variant\\":\\"200 pieces\\",\\"price\\":18.99,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}]}"`
      )
    })
  })
})
