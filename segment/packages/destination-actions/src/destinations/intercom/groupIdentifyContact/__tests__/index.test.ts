import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.groupIdentifyContact', () => {
  it('should create a company and attach a contact', async () => {
    const userId = '9999'
    const contactId = 1
    const event = createTestEvent({ userId, groupId: 'A Company' })

    nock(`${endpoint}`).post(`/companies`).reply(200, { id: 'company123' })
    nock(`${endpoint}`)
      .post(`/contacts/search`)
      .reply(200, { total_count: 1, data: [{ id: contactId }] })
    nock(`${endpoint}`).post(`/contacts/${contactId}/companies`).reply(200, {})

    const responses = await testDestination.testAction('groupIdentifyContact', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(3)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe('{"query":{"field":"external_id","operator":"=","value":"9999"}}') // search is initiated
    expect(responses[1].options.body).toBe('{"company_id":"A Company"}') // company is created
    expect(responses[2].options.body).toBe('{"id":"company123"}') // user is attached
  })

  it('if userId is not sent, then do not send a request to attach', async () => {
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
