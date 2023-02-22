import ga4 from '../index'
import TrafficRecorder from '../../../test/TrafficRecorder'
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'
let recorder: TrafficRecorder
let testDestination: any

import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const requestClient = jest.fn().mockReturnValue((endpoint, payload) => {
  console.log(`MOCKED: ${endpoint}`)
})

beforeEach(function () {
  testDestination = createTestIntegration(ga4)
  recorder = new TrafficRecorder({
    slug: ga4.slug as string,
    endpoint: 'https://www.google-analytics.com/mp/collect'
  })
  return recorder.start()
})

afterEach(function () {
  return recorder.stop()
})

describe('GA4', () => {
  describe('Payment Info Entered', () => {
    it('should append user_properties correctly', async () => {
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
        useDefaultMappings: true,
        createRequestClientFn: requestClient
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"add_payment_info\\",\\"params\\":{\\"items\\":[{\\"item_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"item_id\\":\\"12345abcde\\",\\"currency\\":\\"USD\\",\\"price\\":12.99,\\"quantity\\":1}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}},\\"timestamp_micros\\":1655936458905000}"`
      )
    })
  })
})
