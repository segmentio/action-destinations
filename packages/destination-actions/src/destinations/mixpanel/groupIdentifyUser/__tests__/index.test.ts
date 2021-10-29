import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const MIXPANEL_API_SECRET = 'test-api-key'
const MIXPANEL_PROJECT_TOKEN = 'test-proj-token'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Mixpanel.groupIdentifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      timestamp,
      groupId: 'test-group-id',
      traits: { hello: 'world', company: 'Mixpanel' }
    })

    nock('https://api.mixpanel.com').post('/groups').reply(200, {})

    const responses = await testDestination.testAction('groupIdentifyUser', {
      event,
      mapping: { group_key: 'company' },
      useDefaultMappings: true,
      settings: {
        projectToken: MIXPANEL_PROJECT_TOKEN,
        apiSecret: MIXPANEL_API_SECRET
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toMatchObject(
      new URLSearchParams({
        data: JSON.stringify({
          $token: MIXPANEL_PROJECT_TOKEN,
          $group_key: 'company',
          $group_id: 'Mixpanel',
          $set: {
            hello: 'world',
            company: 'Mixpanel'
          }
        })
      })
    )
  })
})
