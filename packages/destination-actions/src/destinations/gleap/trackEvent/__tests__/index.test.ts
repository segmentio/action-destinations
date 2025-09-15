import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.gleap.io'

describe('Gleap.trackEvent', () => {
  it('should create an event with name and userId', async () => {
    const event = createTestEvent({ event: 'Segment Test Event Name 3', userId: 'user1234' })

    nock(`${endpoint}`).post(`/admin/track`).reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })
})
