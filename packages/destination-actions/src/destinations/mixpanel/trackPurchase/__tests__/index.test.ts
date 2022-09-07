import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

Math.random = jest.fn(() => 1)

describe('Mixpanel.trackPurchase', () => {
  it('should generate purchase event for each product', async () => {
    const event = createTestEvent({
      event: 'Order Completed',
      messageId: '112c2a3c-7242-4327-9090-48a89de6a4110',
      userId: 'abc123',
      timestamp: timestamp,
      anonymousId: 'anon-2134',
      type: 'track',
      properties: {
        affiliation: 'Super Online Store',
        order_number: '56788ddbc-b2',
        coupon: 'Mixpanel Day',
        currency: 'USD',
        products: [
          {
            product_id: '507f1f77bcf86cd799439011',
            sku: '45790-32',
            name: 'Monopoly: 3rd Edition',
            price: 19,
            position: 1,
            quantity: 2,
            coupon: 'MOUNTAIN',
            brand: 'Unknown',
            category: 'Games',
            variant: 'Black',
            url: 'https://www.example.com/product/path',
            image_url: 'https://www.example.com/product/path.jpg'
          },
          {
            product_id: '505bd76785ebb509fc183733',
            sku: '46493-32',
            name: 'Uno Card Game',
            price: 3,
            position: 2,
            category: 'Games'
          }
        ],
        revenue: 5.99,
        shipping: 1.5,
        tax: 3.0,
        total: 24.48
      }
    })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const mapping = {
      generatePurchaseEventPerProduct: true
    }
    const responses = await testDestination.testAction('trackPurchase', {
      event,
      mapping,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"[{\\"event\\":\\"Order Completed\\",\\"properties\\":{\\"time\\":1629213675449,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a4110\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"affiliation\\":\\"Super Online Store\\",\\"order_number\\":\\"56788ddbc-b2\\",\\"coupon\\":\\"Mixpanel Day\\",\\"currency\\":\\"USD\\",\\"products\\":[{\\"product_id\\":\\"507f1f77bcf86cd799439011\\",\\"sku\\":\\"45790-32\\",\\"name\\":\\"Monopoly: 3rd Edition\\",\\"price\\":19,\\"position\\":1,\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"brand\\":\\"Unknown\\",\\"category\\":\\"Games\\",\\"variant\\":\\"Black\\",\\"url\\":\\"https://www.example.com/product/path\\",\\"image_url\\":\\"https://www.example.com/product/path.jpg\\"},{\\"product_id\\":\\"505bd76785ebb509fc183733\\",\\"sku\\":\\"46493-32\\",\\"name\\":\\"Uno Card Game\\",\\"price\\":3,\\"position\\":2,\\"category\\":\\"Games\\"}],\\"revenue\\":5.99,\\"shipping\\":1.5,\\"tax\\":3,\\"total\\":24.48}},{\\"event\\":\\"Product Purchased\\",\\"properties\\":{\\"time\\":1629213675448,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a41100\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"product_id\\":\\"507f1f77bcf86cd799439011\\",\\"sku\\":\\"45790-32\\",\\"category\\":\\"Games\\",\\"name\\":\\"Monopoly: 3rd Edition\\",\\"brand\\":\\"Unknown\\",\\"variant\\":\\"Black\\",\\"price\\":19,\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"position\\":1,\\"url\\":\\"https://www.example.com/product/path\\",\\"image_url\\":\\"https://www.example.com/product/path.jpg\\"}},{\\"event\\":\\"Product Purchased\\",\\"properties\\":{\\"time\\":1629213675447,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a41101\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"product_id\\":\\"505bd76785ebb509fc183733\\",\\"sku\\":\\"46493-32\\",\\"category\\":\\"Games\\",\\"name\\":\\"Uno Card Game\\",\\"price\\":3,\\"position\\":2}}]"`
    )
  })
})
