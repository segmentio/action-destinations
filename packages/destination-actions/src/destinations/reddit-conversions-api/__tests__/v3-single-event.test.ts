import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2024-01-08T13:52:50.212Z'
const settings: Settings = {
  ad_account_id: 'ad_account_id_1',
  conversion_token: 'conversion_token_1'
}

describe('Reddit Conversions Api - V3 single event', () => {
  it('should send a Purchase Standard event to v3 when api_version is v3 and action_source is set', async () => {
    const event = createTestEvent({
      timestamp: timestamp,
      event: 'Order Completed',
      messageId: 'test-message-id-contact',
      type: 'track',
      userId: 'user_id_1',
      properties: {
        click_id: 'click_id_1',
        currency: 'USD',
        quantity: 10,
        revenue: 100,
        uuid: 'uuid_1',
        products: [{ product_id: 'product_id_1', category: 'category_1', name: 'name_1', quantity: 2, price: 25 }],
        email: 'test@test.com'
      },
      context: {
        userAgent: 'test-user-agent',
        ip: '111.111.111.111',
        page: { url: 'https://example.com/checkout' }
      }
    })

    nock('https://ads-api.reddit.com').post('/api/v3/pixels/ad_account_id_1/conversion_events').reply(200, {})
    const responses = await testDestination.testAction('standardEvent', {
      event,
      settings: { ...settings, test_id: 'test-123' },
      useDefaultMappings: true,
      mapping: {
        tracking_type: 'Purchase',
        api_version: 'v3',
        action_source: 'WEBSITE'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      data: {
        partner: 'SEGMENT',
        test_id: 'test-123',
        events: [
          {
            action_source: 'WEBSITE',
            event_source_url: 'https://example.com/checkout',
            click_id: 'click_id_1',
            event_at: 1704721970212,
            type: {
              tracking_type: 'PURCHASE'
            },
            event_metadata: {
              currency: 'USD',
              item_count: 10,
              value: 100,
              products: [
                {
                  category: 'category_1',
                  id: 'product_id_1',
                  name: 'name_1',
                  quantity: 2,
                  item_price: 25
                }
              ]
            }
          }
        ]
      }
    })
  })

  it('should route a Custom event to v3 with UPPER_SNAKE_CASE tracking_type', async () => {
    const event = createTestEvent({
      timestamp: timestamp,
      event: 'Some Custom Event Name',
      messageId: 'test-message-id-contact',
      type: 'track',
      userId: 'user_id_1',
      properties: {}
    })

    nock('https://ads-api.reddit.com').post('/api/v3/pixels/ad_account_id_1/conversion_events').reply(200, {})
    const responses = await testDestination.testAction('customEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        custom_event_name: 'Some Custom Event Name',
        api_version: 'v3',
        action_source: 'APP'
      }
    })

    expect(responses.length).toBe(1)
    const body = responses[0].options.json as { data: { events: Array<{ type: { tracking_type: string } }> } }
    expect(body.data.events[0].type.tracking_type).toBe('CUSTOM')
  })

  it('should stay on v2 when api_version is not set (existing customers)', async () => {
    const event = createTestEvent({
      timestamp: timestamp,
      event: 'Order Completed',
      messageId: 'test-message-id-contact',
      type: 'track',
      userId: 'user_id_1',
      properties: { revenue: 100 }
    })

    nock('https://ads-api.reddit.com').post('/api/v2.0/conversions/events/ad_account_id_1').reply(200, {})
    // api_version is genuinely absent from the mapping here - that's the real "existing customer,
    // pre-dates this field" shape. A literal '' would fail the field's enum (['v3', 'v2.0'])
    // validation before perform() ever runs, so it can't be used to exercise this scenario.
    const responses = await testDestination.testAction('standardEvent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        tracking_type: 'Purchase'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should reject the mapping when api_version is v3 but action_source is not set', async () => {
    const event = createTestEvent({
      timestamp: timestamp,
      event: 'Order Completed',
      messageId: 'test-message-id-contact',
      type: 'track',
      userId: 'user_id_1',
      properties: { revenue: 100 }
    })

    await expect(
      testDestination.testAction('standardEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          tracking_type: 'Purchase',
          api_version: 'v3'
        }
      })
    ).rejects.toThrow("The root value is missing the required field 'action_source'.")
  })

  it('should throw when a product is missing an id (fails Destination-side validation, not schema validation)', async () => {
    const event = createTestEvent({
      timestamp: timestamp,
      event: 'Order Completed',
      messageId: 'test-message-id-contact',
      type: 'track',
      userId: 'user_id_1',
      properties: {
        revenue: 100,
        products: [{ category: 'category_1', name: 'name_1' }]
      }
    })

    await expect(
      testDestination.testAction('standardEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          tracking_type: 'Purchase',
          api_version: 'v3',
          action_source: 'WEBSITE'
        }
      })
    ).rejects.toThrow('products.id is required when sending to Reddit Conversions API v3')
  })
})
