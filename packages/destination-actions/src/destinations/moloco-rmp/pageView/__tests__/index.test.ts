import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('MolocoMCM.pageView', () => {
  it('should successfully build an event and send', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    const event = createTestEvent({
      context: {
        ip: '8.8.8.8',
        library: {
          name: 'analytics.js',
          version: '2.11.1'
        },
        locale: 'en-US',
        location: {
          city: 'San Francisco',
          country: 'United States',
          latitude: 40.2964197,
          longitude: -76.9411617,
          speed: 0
        },
        page: {
          path: '/academy/',
          referrer: '',
          search: '',
          title: 'Analytics Academy',
          url: 'https://segment.com/academy/'
        },
        timezone: 'Europe/Amsterdam',
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      }
    })

    const responses = await testDestination.testAction('pageView', {
      event,
      settings: {
        platformId: 'foo',
        platformName: 'foo',
        apiKey: 'bar',
        channel_type: 'SITE'
      },
      mapping: {
        // page_id is default to context.page.path
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
