import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.trackEvent', () => {
  it('should create an event with epoch seconds and userId', async () => {
    const event = createTestEvent({ event: 'Segment Test Event Name 3' })

    nock(`${endpoint}`).post(`/events`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    const epochDate = Math.floor(new Date(event.timestamp as string).valueOf() / 1000)
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe(
      `{"event_name":"Segment Test Event Name 3","created_at":${epochDate},"user_id":"user1234","metadata":{}}`
    )
  })

  it('should properly convert currency and autopopulate USD', async () => {
    const event = createTestEvent({ event: 'Segment Test Event Name 3', properties: { payment: 100 } })

    nock(`${endpoint}`).post(`/events`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      mapping: { revenue: { '@path': '$.properties.payment' } },
      useDefaultMappings: true
    })

    const epochDate = Math.floor(new Date(event.timestamp as string).valueOf() / 1000)
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe(
      `{"event_name":"Segment Test Event Name 3","created_at":${epochDate},"user_id":"user1234","metadata":{"payment":100,"price":{"amount":10000,"currency":"USD"}}}`
    )
  })

  it('should search for a contact if only the email is passed in', async () => {
    const contactId = '9999'
    const event = createTestEvent({ event: 'Segment Test Event Name 3', properties: { email: 'user@example.com' } })

    nock(`${endpoint}`)
      .post(`/contacts/search`)
      .reply(200, { total_count: 1, data: [{ id: contactId }] })
    nock(`${endpoint}`).post(`/events`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    const epochDate = Math.floor(new Date(event.timestamp as string).valueOf() / 1000)
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe(
      `{"event_name":"Segment Test Event Name 3","created_at":${epochDate},"user_id":"user1234","email":"user@example.com","metadata":{}}`
    )
  })

  it("should return a 404 if a unique user isn't found by email", async () => {
    const event = createTestEvent({
      userId: null,
      event: 'Segment Test Event Name 3',
      properties: { email: 'user@example.com' }
    })

    nock(`${endpoint}`).post(`/contacts/search`).reply(200, { total_count: 1, data: [] })
    nock(`${endpoint}`).post(`/events`).reply(200, {})

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true
      })
    ).rejects.toThrowError(new IntegrationError('No unique contact found', 'Contact not found', 404))
  })
})
