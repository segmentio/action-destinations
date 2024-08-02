import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const event = createTestEvent({
  properties: {
    test_mode: true,
    events: [
      {
        event_at: '2024-07-31T12:00:48.274Z',
        user: {
          email: 'test@gmail.com',
          external_id: 'identity-007',
          ip_address: '11.111.111.111',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        },
        event_type: {
          tracking_type: 'PageVisit'
        },
        event_metadata: {
          currency: 'USD',
          value_decimal: 5000
        }
      }
    ]
  }
})

const authData: Settings = {
  ad_account_id: 't2_3x9i22t0',
  conversion_token: 'test_conversion_token'
}

describe('RedditConversionsApi.reportConversionEvent', () => {
  it('should send an event to Reddit successfully', async () => {
    nock('https://ads-api.reddit.com')
      .post(`/api/v2.0/conversions/events/${authData.ad_account_id}`)
      .matchHeader('Authorization', `Bearer ${authData.conversion_token}`)
      .reply(200, {})

    const responses = await testDestination.testAction('reportConversionEvent', {
      event,
      settings: authData,
      useDefaultMappings: true,
      mapping: {
        test_mode: true,
        events: [
          {
            event_at: '2024-07-31T12:00:48.274Z',
            user: {
              email: 'test@gmail.com',
              external_id: 'identity-007',
              ip_address: '11.111.111.111',
              user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
            },
            event_type: {
              tracking_type: 'PageVisit'
            },
            event_metadata: {
              currency: 'USD',
              value_decimal: 5000
            }
          }
        ]
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchSnapshot()
  })

  // Add additional tests here
})



