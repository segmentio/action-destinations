import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Memora.profileSync', () => {
  it('should work with default mappings', async () => {
    const event = createTestEvent({ type: 'identify', userId: 'test-user-123' })

    nock('https://api.memora.com').post('/profiles').reply(200, {})

    const responses = await testDestination.testAction('profileSync', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should work with batch processing', async () => {
    const events = [
      createTestEvent({ type: 'identify', userId: 'test-user-123' }),
      createTestEvent({ type: 'identify', userId: 'test-user-456' })
    ]

    nock('https://api.memora.com').post('/profiles/batch').reply(200, {})

    const responses = await testDestination.testBatchAction('profileSync', {
      events,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
