import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.identifyUser', () => {
  it('should create a user', async () => {
    const event = createTestEvent({ traits: { name: 'example user', email: 'user@example.com' } })

    nock(`${endpoint}`).post(`/contacts`).reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe(
      `{"role":"user","external_id":"user1234","email":"user@example.com","name":"example user","last_seen_at":"${event.timestamp}","custom_attribute":{"name":"example user","email":"user@example.com"}}`
    )
  })

  it('should update a user if the user already exists', async () => {})
})
