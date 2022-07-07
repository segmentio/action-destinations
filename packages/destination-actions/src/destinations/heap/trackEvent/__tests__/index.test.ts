import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const HEAP_TEST_APP_ID = '11'

describe('Heap.trackEvent', () => {
  it('should validate action fields', async () => {
    const testTimestampValue = '2021-08-17T15:21:15.449Z'
    const event = createTestEvent({ timestamp: testTimestampValue, event: 'Test Event', userId: 'foo@example.org' })

    nock('https://heapanalytics.com').post('/api/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        appId: HEAP_TEST_APP_ID
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject({
      event: 'Test Event',
      app_id: HEAP_TEST_APP_ID,
      identity: 'foo@example.org',
      properties: expect.objectContaining({
        segment_library: 'analytics.js'
      }),
      timestamp: testTimestampValue,
      idempotency_key: '1'
    })
  })
})
