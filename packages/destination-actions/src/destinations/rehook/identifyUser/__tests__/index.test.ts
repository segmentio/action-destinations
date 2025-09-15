import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const REHOOK_API_KEY = 'SOME_API_KEY'
const REHOOK_API_SECRET = 'SOME_API_SECRET'

describe('Rehook.identifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ traits: { name: 'abc' } })

    nock(`https://api.rehook.ai`).post(`/customers`).reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
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
    expect(responses[0].options.body).toBe(`{"source_id":"user1234","metadata":{"name":"abc"}}`)
  })

  it('should require api_id and api_key', async () => {
    const event = createTestEvent()
    nock(`https://api.rehook.ai`).post(`/customers`).reply(200, {})

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Missing API KEY or API SECRET')
  })
})
