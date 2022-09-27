import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Mixpanel.trackPurchase', () => {
  it('should create purchase event for each product', async () => {
    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: timestamp,
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

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Order Completed',
        properties: expect.objectContaining({
          ip: '8.8.8.8',
          distinct_id: 'user1234',
          $current_url: 'https://segment.com/academy/',
          $locale: 'en-US',
          mp_country_code: 'United States',
          mp_lib: 'Segment: analytics.js'
        })
      }
    ])
  })


})
