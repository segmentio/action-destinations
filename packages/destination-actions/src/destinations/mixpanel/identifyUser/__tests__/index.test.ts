import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Mixpanel.identifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ timestamp, traits: { abc: '123' } })

    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.US
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$identify',
          properties: {
            $identified_id: 'user1234',
            $anon_id: event.anonymousId,
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $set: {
            abc: '123'
          }
        })
      })
    )
  })

  it('should use EU server URL', async () => {
    const event = createTestEvent({ timestamp, traits: { abc: '123' } })

    nock('https://api-eu.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api-eu.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.EU
      }
    })
    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$identify',
          properties: {
            $identified_id: 'user1234',
            $anon_id: event.anonymousId,
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $set: {
            abc: '123'
          }
        })
      })
    )
  })
})
