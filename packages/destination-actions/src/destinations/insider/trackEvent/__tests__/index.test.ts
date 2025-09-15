import nock from 'nock'
import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const useDefaultMappings = true

describe('Insider.trackEvent', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should insert test track event', async () => {
    nock('https://unification.useinsider.com').post('/api/user/v1/upsert').reply(200, {})

    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      anonymousId: 'test'
    })

    const responses = await testDestination.testAction('trackEvent', { event, useDefaultMappings })
    expect(responses[0].status).toBe(200)
  })

  it('should insert test track events in batch', async () => {
    nock('https://unification.useinsider.com').post('/api/user/v1/upsert').reply(200, { success: 2 })

    const events = [
      createTestEvent({
        timestamp,
        event: 'Test Event',
        anonymousId: 'test'
      }),
      createTestEvent({
        timestamp,
        event: 'Test Event',
        anonymousId: 'test2'
      })
    ]

    const request = await testDestination.testBatchAction('trackEvent', { events, useDefaultMappings })

    expect(request[0].status).toBe(200)
  })
})
