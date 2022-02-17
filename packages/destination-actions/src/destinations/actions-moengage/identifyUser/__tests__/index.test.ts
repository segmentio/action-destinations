import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { getEndpointByRegion } from '../../regional-endpoints'

const testDestination = createTestIntegration(Destination)
const MOENGAGE_API_ID = 'SOME_APP_ID'
const MOENGAGE_API_KEY = 'SOME_APP_KEY'
const MOENGAGE_REGION = 'SOME_REGION'

const endpoint = getEndpointByRegion()

describe('ActionsMoengage.identifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ traits: { name: 'abc' } })

    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${MOENGAGE_API_ID}`).reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        api_id: MOENGAGE_API_ID,
        api_key: MOENGAGE_API_KEY,
        region: MOENGAGE_REGION
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe(
      `{"type":"track","user_id":"user1234","traits":{"name":"abc"},"context":{"app":{},"os":{},"library":{"version":"2.11.1"}},"anonymous_id":"${event.anonymousId}","timestamp":"${event.timestamp}"}`
    )
  })

  it('should require api_id and api_key', async () => {
    const event = createTestEvent()
    nock(`${endpoint}`).post(`/v1/integrations/segment?appId=${MOENGAGE_API_ID}`).reply(200, {})

    try {
      await testDestination.testAction('identifyUser', {
        event,
        useDefaultMappings: true
      })
    } catch (e) {
      expect(e.message).toBe('Missing API ID or API KEY')
    }
  })
})
