import nock from 'nock'
import { createTestEvent, createTestIntegration, RetryableError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.groupIdentifyContact', () => {
  it('should create a company and attach a contact', async () => {
    const userId = '9999'
    const event = createTestEvent({ userId, groupId: 'A Company' })

    nock(`${endpoint}`).post(`/companies`).reply(200, {})
    nock(`${endpoint}`).post(`/contacts/${userId}/companies`).reply(200, {})

    const responses = await testDestination.testAction('groupIdentifyContact', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe('{"company_id":"A Company"}') // userId is deleted from the body since it isn't sent to Intercom
  })

  it("should throw a retryable error if the user doesn't exist", async () => {
    const userId = '9999'
    const event = createTestEvent({ userId: '9999', groupId: 'A Company' })

    nock(`${endpoint}`).post(`/companies`).reply(200, {})
    nock(`${endpoint}`).post(`/contacts/${userId}/companies`).reply(404, {})

    await expect(
      testDestination.testAction('groupIdentifyContact', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new RetryableError(`Contact doesn't exist, retrying`))
  })
})
