import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
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

  it('if contact ID is not sent, then do not send a request to attach', async () => {
    const event = createTestEvent({ userId: null, groupId: 'A Company' })

    nock(`${endpoint}`).post(`/companies`).reply(200, {})

    const responses = await testDestination.testAction('groupIdentifyContact', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })
})
