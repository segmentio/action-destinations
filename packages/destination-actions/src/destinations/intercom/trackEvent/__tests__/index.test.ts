import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.intercom.io'

describe('Intercom.trackEvent', () => {
  it('should create an event with epoch seconds', async () => {
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
})
