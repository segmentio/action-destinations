import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const REHOOK_API_KEY = 'SOME_API_KEY'
const REHOOK_API_SECRET = 'SOME_API_SECRET'

describe('Rehook.trackEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ event: 'Test Event' })

    nock(`https://api.rehook.ai`).post(`/events/invoke`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        api_key: REHOOK_API_KEY,
        api_secret: REHOOK_API_SECRET
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event_name: 'Test Event',
      metadata: {},
      source_id: 'user1234'
    })
  })

  it('should require userId and anonymousId field', async () => {
    const event = createTestEvent({})
    event.userId = undefined
    event.anonymousId = undefined

    nock(`https://api.rehook.ai`).post(`/events/invoke`).reply(200, {})

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          api_key: REHOOK_API_KEY,
          api_secret: REHOOK_API_SECRET
        }
      })
    ).rejects.toThrowError("The root value is missing the required field 'source_id'.")
  })
})
