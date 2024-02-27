import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const endpoint = 'https://api.gleap.io'

describe('Gleap.identifyContact', () => {
  it('should identify a user', async () => {
    const event = createTestEvent({
      traits: { name: 'example user', email: 'user@example.com', userId: 'example-129394' }
    })

    nock(`${endpoint}`).post(`/admin/identify`).reply(200, {})

    const responses = await testDestination.testAction('identifyContact', {
      event,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
  })
})
