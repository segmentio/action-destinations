import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'

describe('Mixpanel.incrementProperty', () => {
  it('should $add values to increment numerical properties', async () => {
    const event = createTestEvent({
      userId: 'user1234',
      properties: {
        abc: '123',
        $add: {
          positive: 2,
          negative: '-2'
        }
      }
    })

    nock('https://api.mixpanel.com').post('/track').reply(200, {})
    nock('https://api.mixpanel.com').post('/engage').reply(200, {})

    const [response] = await testDestination.testAction('incrementProperty', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })

    expect(response.status).toBe(200)
    expect(response.data).toMatchObject({})
    expect(response.options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: event.userId,
          $ip: '8.8.8.8',
          $add: {
            positive: 2,
            negative: -2
          }
        })
      })
    )
  })

  it('should use anonymous_id as distinct_id if user_id is missing', async () => {
    const event = createTestEvent({
      userId: null,
      properties: {
        abc: '123',
        $add: {
          positive: 2,
          negative: '-2'
        }
      }
    })

    nock('https://api.mixpanel.com').post('/track').reply(200, {})
    nock('https://api.mixpanel.com').post('/engage').reply(200, {})

    const [response] = await testDestination.testAction('incrementProperty', {
      event,
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET,
        sourceName: 'example segment source name'
      }
    })

    expect(response.status).toBe(200)
    expect(response.data).toMatchObject({})
    expect(response.options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $distinct_id: event.anonymousId,
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
