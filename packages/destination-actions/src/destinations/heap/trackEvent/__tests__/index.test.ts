import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const HEAP_TEST_APP_ID = '11'

describe('Heap.trackEvent', () => {
  it('should validate action fields for identified users', async () => {
    const testTimestampValue = '2021-08-17T15:21:15.449Z'
    const event = createTestEvent({
      timestamp: testTimestampValue,
      event: 'Test Event',
      userId: 'foo@example.org',
      messageId: '123'
    })

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
      idempotency_key: '123'
    })
  })

  it('should validate action fields for anonymous users', async () => {
    const testTimestampValue = '2021-08-17T15:21:15.449Z'
    const event = createTestEvent({
      timestamp: testTimestampValue,
      event: 'Test Event',
      anonymousId: '5a41f0df-b69a-4a99-b656-79506a86c3f8',
      userId: null,
      messageId: '123'
    })

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
      use_user_id: true,
      user_id: 8325872782136936,
      properties: expect.objectContaining({
        segment_library: 'analytics.js'
      }),
      timestamp: testTimestampValue,
      idempotency_key: '123'
    })
  })
})
