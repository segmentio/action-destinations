import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const API_KEY = 'sample-api-token'
const API_URL = 'https://main-api.nudgenow.com/api/'
const timestamp = '2025-05-12T12:35:12.826Z'

describe('Nudge.trackEvent', () => {
  it('should require event field', async () => {
    const event = createTestEvent({ timestamp })
    event.event = undefined

    try {
      await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          apikey: API_KEY,
          platform: '11'
        }
      })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'name'.")
    }
  })

  it('should succeed', async () => {
    const event = createTestEvent({ timestamp, event: 'Test Event 1', userId: 'test_may_12_2' })

    nock(API_URL).post('/integration/segment/events/batch').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apikey: API_KEY,
        platform: '11'
      }
    })

    expect(responses[0].status).toBe(200)
  })

  it('should invoke performBatch for batches', async () => {
    const events = [
      createTestEvent({ timestamp, event: 'Test event 2' }),
      createTestEvent({ timestamp, event: 'Test event 3' })
    ]

    nock(API_URL).post('/integration/segment/events/batch').reply(200, {})

    const responses = await testDestination.testBatchAction('trackEvent', {
      events,
      useDefaultMappings: true,
      settings: {
        apikey: API_KEY,
        platform: '11'
      }
    })

    expect(responses[0].status).toBe(200)
  })
})
