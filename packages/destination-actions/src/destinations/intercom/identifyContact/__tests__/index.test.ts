import nock from 'nock'
import { createTestEvent, createTestIntegration, RetryableError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.identifyContact', () => {
  it('should update a user if the user already exists', async () => {
    const userId = '9999'

    const event = createTestEvent({ traits: { name: 'example user', email: 'user@example.com' } })

    nock(`${endpoint}`)
      .post(`/contacts/search`)
      .reply(200, { total_count: 1, data: [{ id: userId }] })
    nock(`${endpoint}`).put(`/contacts/${userId}`).reply(200, {})

    const responses = await testDestination.testAction('identifyContact', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].options.body).toBe(
      `{"role":"lead","external_id":"user1234","email":"user@example.com","name":"example user","last_seen_at":"${event.timestamp}"}`
    )
  })

  it('should create a user if the user does not exist', async () => {
    const event = createTestEvent({ traits: { name: 'example user', email: 'user@example.com' } })

    nock(`${endpoint}`).post(`/contacts/search`).reply(200, { total_count: 0, data: [] })
    nock(`${endpoint}`).post(`/contacts`).reply(200, {})

    const responses = await testDestination.testAction('identifyContact', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(responses[1].options.body).toBe(
      `{"role":"lead","external_id":"user1234","email":"user@example.com","name":"example user","last_seen_at":"${event.timestamp}"}`
    )
  })

  it("should throw a retryable error if the user doesn't come up in a search but is a duplicate", async () => {
    const event = createTestEvent({ traits: { name: 'example user', email: 'user@example.com' } })

    nock(`${endpoint}`).post(`/contacts`).reply(409, {})
    nock(`${endpoint}`).post(`/contacts/search`).reply(200, {})

    await expect(
      testDestination.testAction('identifyContact', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(
      new RetryableError(
        `Contact was reported duplicated but could not be searched for, probably due to Intercom search cache not being updated`
      )
    )
  })
})
