import nock from 'nock'
import { createTestEvent, createTestIntegration, omit } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'
import { SegmentEvent } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

const orderCompletedEvent: Partial<SegmentEvent> = {
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
        category: 'Games',
        custom: 'xyz'
      }
    ],
    revenue: 5.99,
    shipping: 1.5,
    tax: 3.0,
    total: 24.48
  }
}

const expectedOrderCompleted = {
  ...omit(orderCompletedEvent, ['anonymousId', 'messageId', 'timestamp', 'type', 'userId'])
}

const settingsObj = {
  projectToken: MIXPANEL_PROJECT_TOKEN,
  apiSecret: MIXPANEL_API_SECRET,
  apiRegion: ApiRegions.US
}

Math.random = jest.fn(() => 1)

describe('Mixpanel.trackPurchase', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: settingsObj
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([expectedOrderCompleted])
  })

  it('should use EU server URL', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api-eu.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.EU
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([expectedOrderCompleted])
  })

  it('should default to US endpoint if apiRegion setting is undefined', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([expectedOrderCompleted])
  })

  it('should send segment_source_name property if sourceName setting is defined', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const sourceName = 'example segment source name'
    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        sourceName
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Order Completed',
        properties: expect.objectContaining({
          segment_source_name: sourceName
        })
      }
    ])
  })

  it('should not send segment_source_name property if sourceName setting is undefined', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([expectedOrderCompleted])
  })

  it('should require event field', async () => {
    const event = createTestEvent(orderCompletedEvent)
    event.event = undefined

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    try {
      await testDestination.testAction('trackPurchase', { event, useDefaultMappings: true })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'event'.")
    }
  })

  it('should invoke performBatch for batches', async () => {
    const events = [createTestEvent(orderCompletedEvent), createTestEvent(orderCompletedEvent)]

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testBatchAction('trackPurchase', {
      events,
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
    expect(responses[0].options.json).toMatchObject([expectedOrderCompleted, expectedOrderCompleted])
  })

  it('should generate a purchase event for each product', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const mapping = {
      generatePurchaseEventPerProduct: true
    }
    const responses = await testDestination.testAction('trackPurchase', {
      event,
      mapping,
      useDefaultMappings: true,
      settings: settingsObj
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"[{\\"event\\":\\"Order Completed\\",\\"properties\\":{\\"time\\":1629213675449,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a4110\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"affiliation\\":\\"Super Online Store\\",\\"order_number\\":\\"56788ddbc-b2\\",\\"coupon\\":\\"Mixpanel Day\\",\\"currency\\":\\"USD\\",\\"products\\":[{\\"product_id\\":\\"507f1f77bcf86cd799439011\\",\\"sku\\":\\"45790-32\\",\\"name\\":\\"Monopoly: 3rd Edition\\",\\"price\\":19,\\"position\\":1,\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"brand\\":\\"Unknown\\",\\"category\\":\\"Games\\",\\"variant\\":\\"Black\\",\\"url\\":\\"https://www.example.com/product/path\\",\\"image_url\\":\\"https://www.example.com/product/path.jpg\\"},{\\"product_id\\":\\"505bd76785ebb509fc183733\\",\\"sku\\":\\"46493-32\\",\\"name\\":\\"Uno Card Game\\",\\"price\\":3,\\"position\\":2,\\"category\\":\\"Games\\",\\"custom\\":\\"xyz\\"}],\\"revenue\\":5.99,\\"shipping\\":1.5,\\"tax\\":3,\\"total\\":24.48}},{\\"event\\":\\"Product Purchased\\",\\"properties\\":{\\"time\\":1629213675448,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a41100\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"product_id\\":\\"507f1f77bcf86cd799439011\\",\\"sku\\":\\"45790-32\\",\\"category\\":\\"Games\\",\\"name\\":\\"Monopoly: 3rd Edition\\",\\"brand\\":\\"Unknown\\",\\"variant\\":\\"Black\\",\\"price\\":19,\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"position\\":1,\\"url\\":\\"https://www.example.com/product/path\\",\\"image_url\\":\\"https://www.example.com/product/path.jpg\\"}},{\\"event\\":\\"Product Purchased\\",\\"properties\\":{\\"time\\":1629213675447,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a41101\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"product_id\\":\\"505bd76785ebb509fc183733\\",\\"sku\\":\\"46493-32\\",\\"category\\":\\"Games\\",\\"name\\":\\"Uno Card Game\\",\\"price\\":3,\\"position\\":2}}]"`
    )
  })

  it('should NOT generate a purchase event for each product', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const mapping = {
      generatePurchaseEventPerProduct: false
    }
    const responses = await testDestination.testAction('trackPurchase', {
      event,
      mapping,
      useDefaultMappings: true,
      settings: settingsObj
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"[{\\"event\\":\\"Order Completed\\",\\"properties\\":{\\"time\\":1629213675449,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a4110\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"affiliation\\":\\"Super Online Store\\",\\"order_number\\":\\"56788ddbc-b2\\",\\"coupon\\":\\"Mixpanel Day\\",\\"currency\\":\\"USD\\",\\"products\\":[{\\"product_id\\":\\"507f1f77bcf86cd799439011\\",\\"sku\\":\\"45790-32\\",\\"name\\":\\"Monopoly: 3rd Edition\\",\\"price\\":19,\\"position\\":1,\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"brand\\":\\"Unknown\\",\\"category\\":\\"Games\\",\\"variant\\":\\"Black\\",\\"url\\":\\"https://www.example.com/product/path\\",\\"image_url\\":\\"https://www.example.com/product/path.jpg\\"},{\\"product_id\\":\\"505bd76785ebb509fc183733\\",\\"sku\\":\\"46493-32\\",\\"name\\":\\"Uno Card Game\\",\\"price\\":3,\\"position\\":2,\\"category\\":\\"Games\\",\\"custom\\":\\"xyz\\"}],\\"revenue\\":5.99,\\"shipping\\":1.5,\\"tax\\":3,\\"total\\":24.48}}]"`
    )
  })

  it('should NOT generate a purchase event for each product by default', async () => {
    const event = createTestEvent(orderCompletedEvent)

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackPurchase', {
      event,
      useDefaultMappings: true,
      settings: settingsObj
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"[{\\"event\\":\\"Order Completed\\",\\"properties\\":{\\"time\\":1629213675449,\\"ip\\":\\"8.8.8.8\\",\\"id\\":\\"abc123\\",\\"distinct_id\\":\\"abc123\\",\\"$browser\\":\\"Mozilla\\",\\"$current_url\\":\\"https://segment.com/academy/\\",\\"$insert_id\\":\\"112c2a3c-7242-4327-9090-48a89de6a4110\\",\\"$lib_version\\":\\"2.11.1\\",\\"$locale\\":\\"en-US\\",\\"$source\\":\\"segment\\",\\"mp_country_code\\":\\"United States\\",\\"mp_lib\\":\\"Segment: analytics.js\\",\\"affiliation\\":\\"Super Online Store\\",\\"order_number\\":\\"56788ddbc-b2\\",\\"coupon\\":\\"Mixpanel Day\\",\\"currency\\":\\"USD\\",\\"products\\":[{\\"product_id\\":\\"507f1f77bcf86cd799439011\\",\\"sku\\":\\"45790-32\\",\\"name\\":\\"Monopoly: 3rd Edition\\",\\"price\\":19,\\"position\\":1,\\"quantity\\":2,\\"coupon\\":\\"MOUNTAIN\\",\\"brand\\":\\"Unknown\\",\\"category\\":\\"Games\\",\\"variant\\":\\"Black\\",\\"url\\":\\"https://www.example.com/product/path\\",\\"image_url\\":\\"https://www.example.com/product/path.jpg\\"},{\\"product_id\\":\\"505bd76785ebb509fc183733\\",\\"sku\\":\\"46493-32\\",\\"name\\":\\"Uno Card Game\\",\\"price\\":3,\\"position\\":2,\\"category\\":\\"Games\\",\\"custom\\":\\"xyz\\"}],\\"revenue\\":5.99,\\"shipping\\":1.5,\\"tax\\":3,\\"total\\":24.48}}]"`
    )
  })
})
