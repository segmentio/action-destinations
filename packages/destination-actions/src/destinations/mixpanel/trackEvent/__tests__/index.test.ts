import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Mixpanel.trackEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event' })

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
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
    expect(responses[0].options.json).toMatchObject([
      {
        event: 'Test Event',
        properties: expect.objectContaining({
          $ip: '8.8.8.8',
          distinct_id: 'user1234',
          $current_url: 'https://segment.com/academy/',
          $lib_version: '2.11.1',
          $locale: 'en-US',
          $source: 'segment',
          id: 'user1234',
          mp_country_code: 'United States',
          mp_lib: 'segment'
        })
      }
    ])
  })

  it('should require event field', async () => {
    const event = createTestEvent({ timestamp })
    event.event = undefined

    nock('https://api.mixpanel.com').post('/import?strict=1').reply(200, {})

    try {
      await testDestination.testAction('trackEvent', { event, useDefaultMappings: true })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'event'.")
    }
  })
})
