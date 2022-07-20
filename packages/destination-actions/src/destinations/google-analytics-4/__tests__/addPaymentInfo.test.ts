import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Payment Info Entered', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
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
      const responses = await testDestination.testAction('addPaymentInfo', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        features: { 'actions-google-analytics-4-add-timestamp': true },
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
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"add_payment_info\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"USD\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: 'abc123',
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
      const responses = await testDestination.testAction('addPaymentInfo', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          user_id: {
            '@path': '$.userId'
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
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"user_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"add_payment_info\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"USD\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should allow for currency to be lowercase', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
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
      const responses = await testDestination.testAction('addPaymentInfo', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          user_id: {
            '@path': '$.userId'
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
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"user_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"add_payment_info\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"usd\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should handle default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: '1234abc',
        timestamp: '2022-06-22T22:20:58.905Z',
        type: 'track',
        properties: {
          currency: 'USD',
          value: 10,
          coupon: 'SUMMER_FUN',
          payment_method: 'Credit Card',
          products: [
            {
              product_id: '12345',
              name: 'Monopoly: 3rd Edition',
              currency: 'USD'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('addPaymentInfo', {
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
        `"{\\"client_id\\":\\"1234abc\\",\\"events\\":[{\\"name\\":\\"add_payment_info\\",\\"params\\":{\\"currency\\":\\"USD\\",\\"value\\":10,\\"coupon\\":\\"SUMMER_FUN\\",\\"payment_type\\":\\"Credit Card\\",\\"items\\":[{\\"item_name\\":\\"Monopoly: 3rd Edition\\",\\"item_id\\":\\"12345\\"}],\\"engagement_time_msec\\":1}}],\\"timestamp_micros\\":1655936458905000}"`
      )
    })

    it('should throw an error when no items array is included', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: '1234abc',
        type: 'track',
        properties: {
          currency: 'USD',
          price: 10
        }
      })
      try {
        await testDestination.testAction('addPaymentInfo', {
          event,
          settings: {
            apiSecret,
            measurementId
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

    it('should throw an error when an empty items array is included', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: '1234abc',
        type: 'track',
        properties: {
          currency: 'USD',
          price: 10,
          products: []
        }
      })
      try {
        await testDestination.testAction('addPaymentInfo', {
          event,
          settings: {
            apiSecret,
            measurementId
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
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('Google requires one or more products in add_payment_info events.')
      }
    })

    it('should throw an error when a value is included with no currency', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
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
        await testDestination.testAction('addPaymentInfo', {
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
        expect(e.message).toBe('Currency is required if value is set.')
      }
    })

    it('should throw an error when no currency is included', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
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
        await testDestination.testAction('addPaymentInfo', {
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
          useDefaultMappings: false
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('One of item-level currency or top-level currency is required.')
      }
    })

    it('should correctly append params', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: 'abc123',
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

      const responses = await testDestination.testAction('addPaymentInfo', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          user_id: {
            '@path': '$.userId'
          },
          params: {
            Test_key: 'test_value'
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
        `"{\\"client_id\\":\\"anon-2134\\",\\"user_id\\":\\"abc123\\",\\"events\\":[{\\"name\\":\\"add_payment_info\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"USD\\",\\"price\\":12.99,\\"quantity\\":1}],\\"Test_key\\":\\"test_value\\"}}]}"`
      )
    })

    it('should throw an error when param value is null', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: 'abc123',
        type: 'track',
        properties: {
          products: [
            {
              product_id: '123456',
              currency: 'USD'
            }
          ]
        }
      })
      try {
        await testDestination.testAction('addPaymentInfo', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          features: { 'actions-google-analytics-4-verify-params-feature': true },
          mapping: {
            client_id: {
              '@path': '$.userId'
            },
            params: {
              test_key: null
            },
            items: [
              {
                item_id: {
                  '@path': '$.properties.products.0.product_id'
                },
                currency: {
                  '@path': `$.properties.products.0.currency`
                }
              }
            ]
          },
          useDefaultMappings: false
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe(
          'GA4 only accepts string or number values for event parameters and item parameters. Please ensure you are not including null, array, or nested values.'
        )
      }
    })

    it('should throw an error when user_properties value is an array', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Payment Info Entered',
        userId: 'abc123',
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
      try {
        await testDestination.testAction('addPaymentInfo', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          features: { 'actions-google-analytics-4-verify-params-feature': true },
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
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe(
          'GA4 only accepts string, number or null values for user properties. Please ensure you are not including array or nested values.'
        )
      }
    })
  })
})
