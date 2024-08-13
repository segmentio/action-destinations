import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  ad_account_id: 'test_ad_account_id',
  conversion_token: 'test_conversion_token'
}

describe('RedditConversionsApi.viewContent', () => {
  it('should handle a basic event', async () => {
    nock(`https://ads-api.reddit.com/api/v2.0/conversions/events/${settings.ad_account_id}`).post('/').reply(200, {})

    const event = createTestEvent({
      properties: {
        event_at: '2024-08-13T00:00:00Z',
        event_type: {
          tracking_type: 'ViewContent'
        },
        click_id: 'testCLKid',
        event_metadata: {
          products: {
            category: 'cat1',
            id: 'prod1',
            name: 'product1'
          }
        },
        user: {
          idfa: 'test_idfa',
          email: 'testuser@example.com',
          external_id: 'external_user_id',
          ip_address: '192.168.0.1',
          opt_out: false,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          uuid: 'user_uuid',
          data_processing_options: {
            country: 'US',
            modes: 'LDU',
            region: 'CA'
          },
          screen_dimensions: {
            height: 1080,
            width: 1920
          }
        }
      }
    })

    const responses = await testDestination.testAction('viewContent', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: {
        event_at: { '@path': '$.properties.event_at' },
        event_type: { '@path': '$.properties.event_type' },
        click_id: { '@path': '$.properties.click_id' },
        event_metadata: { '@path': '$.properties.event_metadata' },
        user: { '@path': '$.properties.user' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should throw an error if the required fields are missing', async () => {
    const event = createTestEvent({
      properties: {
        //event_at: '2024-08-13T00:00:00Z', MISSING REQUIRED EVENT
        event_type: {
          tracking_type: 'ViewContent'
        },
        click_id: 'testCLKid',
        event_metadata: {
          products: {
            category: 'cat1',
            id: 'prod1',
            name: 'product1'
          }
        },
        user: {
          idfa: 'test_idfa',
          email: 'testuser@example.com',
          external_id: 'external_user_id',
          ip_address: '192.168.0.1',
          opt_out: false,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          uuid: 'user_uuid',
          data_processing_options: {
            country: 'US',
            modes: 'LDU',
            region: 'CA'
          },
          screen_dimensions: {
            height: 1080,
            width: 1920
          }
        }
      }
    })

    await expect(
      testDestination.testAction('viewContent', {
        event,
        settings,
        mapping: {
          //event_at: { '@path': '$.properties.event_at' }, MISSING EVENT
          event_type: { '@path': '$.properties.event_type' },
          click_id: { '@path': '$.properties.click_id' },
          event_metadata: { '@path': '$.properties.event_metadata' },
          user: { '@path': '$.properties.user' }
        }
      })
    ).rejects.toThrowError('Must include required field event_at')
  })
})
