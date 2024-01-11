import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Mixpanel.incrementProperties', () => {
  const defaultProperties = { term: 'foo', increment: { searches: 1 } }
  it('should use EU server URL', async () => {
    const event = createTestEvent({ timestamp, event: 'search', properties: defaultProperties })

    nock('https://api-eu.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api-eu.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('incrementProperties', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        apiRegion: ApiRegions.EU
      }
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $add: {
            searches: 1
          }
        })
      })
    )
  })

  it('should default to US endpoint if apiRegion setting is undefined', async () => {
    const event = createTestEvent({ timestamp, event: 'search', properties: defaultProperties })

    nock('https://api.mixpanel.com').post('/engage').reply(200, {})
    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('incrementProperties', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $add: {
            searches: 1
          }
        })
      })
    )
  })

  it('should use anonymous_id as distinct_id if user_id is missing', async () => {
    const event = createTestEvent({ userId: null, event: 'search', properties: defaultProperties })

    nock('https://api.mixpanel.com').post('/track').reply(200, {})
    nock('https://api.mixpanel.com').post('/engage').reply(200, {})

    const responses = await testDestination.testAction('incrementProperties', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: event.anonymousId,
          $ip: '8.8.8.8',
          $add: {
            searches: 1
          }
        })
      })
    )
  })

  it('should $add values to increment numerical properties', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'search',
      properties: {
        abc: '123',
        increment: {
          positive: 2,
          negative: -2
        }
      }
    })

    nock('https://api.mixpanel.com').post('/track').reply(200, {})
    nock('https://api.mixpanel.com').post('/engage').reply(200, {})

    const responses = await testDestination.testAction('incrementProperties', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: 'user1234',
          $ip: '8.8.8.8',
          $add: {
            positive: 2,
            negative: -2
          }
        })
      })
    )
  })
})
