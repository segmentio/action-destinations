import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Custom Event', () => {
    it('should handle default mappings', async () => {
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
          ]
        }
      })
      const responses = await testDestination.testAction('customEvent', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          name: 'this_is_a_test'
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
                  "Segment",
                ],
              },
            }
          `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"this_is_a_test\\",\\"params\\":{\\"affiliation\\":\\"TI Online Store\\",\\"order_id\\":\\"5678dd9087-78\\",\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"EUR\\",\\"products\\":[{\\"product_id\\":\\"pid-123456\\",\\"sku\\":\\"SKU-123456\\",\\"name\\":\\"Tour t-shirt\\",\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"brand\\":\\"Canvas\\",\\"category\\":\\"T-Shirt\\",\\"variant\\":\\"Black\\",\\"price\\":19.98}]}}]}"`
      )
    })

    it('should succeed without any parameters provided', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Order Completed',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track'
      })
      const responses = await testDestination.testAction('customEvent', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          name: 'this_is_a_test'
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
                    "Segment",
                  ],
                },
              }
            `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"this_is_a_test\\",\\"params\\":{}}]}"`
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
          custom_props: {
            order_id: '5678dd9087-78',
            coupon: 'SUMMER_FEST',
            currency: 'USD',
            revenue: 11.99,
            total: 15.99
          },
          tax: 55
        }
      })
      const responses = await testDestination.testAction('customEvent', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          name: 'this_is_a_test',
          params: {
            '@path': '$.properties.custom_props'
          }
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
              "Segment",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-567890\\",\\"events\\":[{\\"name\\":\\"this_is_a_test\\",\\"params\\":{\\"order_id\\":\\"5678dd9087-78\\",\\"coupon\\":\\"SUMMER_FEST\\",\\"currency\\":\\"USD\\",\\"revenue\\":11.99,\\"total\\":15.99}}]}"`
      )
    })
  })
})
