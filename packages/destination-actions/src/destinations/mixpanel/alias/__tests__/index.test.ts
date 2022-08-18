import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { ApiRegions } from '../../utils'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'

describe('Mixpanel.alias', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ previousId: 'test-prev-id' })

    nock('https://api.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('alias', {
      event,
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
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$create_alias',
          properties: {
            distinct_id: 'test-prev-id',
            alias: 'user1234',
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
  })

  it('should use EU server URL', async () => {
    const event = createTestEvent({ previousId: 'test-prev-id' })

    nock('https://api-eu.mixpanel.com').post('/track').reply(200, {})

    const responses = await testDestination.testAction('alias', {
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
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          event: '$create_alias',
          properties: {
            distinct_id: 'test-prev-id',
            alias: 'user1234',
            token: MIXPANEL_PROJECT_TOKEN
          }
        })
      })
    )
  })
})
