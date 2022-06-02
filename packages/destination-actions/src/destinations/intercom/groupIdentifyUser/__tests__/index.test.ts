import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.groupIdentifyUser', () => {
  it('should create a company and attach a contact', async () => {
    const userId = '9999'
    const event = createTestEvent({ userId: '9999', groupId: 'A Company' })

    nock(`${endpoint}`).post(`/companies`).reply(200, {})
    nock(`${endpoint}`).post(`/contacts/${userId}/companies`).reply(200, {})

    const responses = await testDestination.testAction('groupIdentifyUser', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe('{"company_id":"A Company","user_id":"9999","custom_attributes":{}}')
  })

  it("should throw a retryable error if the user doesn't exist", async () => {})
})
