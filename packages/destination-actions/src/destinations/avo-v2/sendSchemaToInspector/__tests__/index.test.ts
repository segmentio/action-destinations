import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Avo.sendSchemaToInspector', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ previousId: 'test-prev-id' })

    nock('https://api.avo.app').post('/inspector/segment/v1/track').reply(200, {})

    const responses = await testDestination.testAction('sendSchemaToInspector', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        env: 'dev'
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
  })

  it('should deduplicate event spec fetches within a batch', async () => {
    const event1 = createTestEvent({
      event: 'TestEvent',
      anonymousId: 'test-anon-id-1'
    })
    const event2 = createTestEvent({
      event: 'TestEvent',
      anonymousId: 'test-anon-id-1'
    })
    const event3 = createTestEvent({
      event: 'AnotherEvent',
      anonymousId: 'test-anon-id-1'
    })

    // Mock event spec endpoint - should only be called twice (once per unique event name)
    // Even though TestEvent appears twice in the batch, it should only be fetched once
    const testEventSpecScope = nock('https://api.avo.app')
      .get('/trackingPlan/eventSpec')
      .query((query) => query.eventName === 'TestEvent' && query.streamId === 'test-anon-id-1')
      .once() // Should be called exactly once, not twice
      .reply(200, {
        events: [],
        metadata: { schemaId: 'test-schema', branchId: 'main', latestActionId: 'test', sourceId: 'test' }
      })

    const anotherEventSpecScope = nock('https://api.avo.app')
      .get('/trackingPlan/eventSpec')
      .query((query) => query.eventName === 'AnotherEvent' && query.streamId === 'test-anon-id-1')
      .once() // Should be called exactly once
      .reply(200, {
        events: [],
        metadata: { schemaId: 'test-schema', branchId: 'main', latestActionId: 'test', sourceId: 'test' }
      })

    // Mock track endpoint - should receive all 3 events in a single request
    const trackScope = nock('https://api.avo.app')
      .post('/inspector/segment/v1/track', (body) => {
        // Body may be a string (JSON) or already parsed object depending on nock version
        const events = Array.isArray(body) ? body : typeof body === 'string' ? JSON.parse(body) : body
        return Array.isArray(events) && events.length === 3
      })
      .reply(200, {})

    const responses = await testDestination.testBatchAction('sendSchemaToInspector', {
      events: [event1, event2, event3],
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        env: 'dev'
      }
    })

    // Filter to only POST responses (ignore GET requests for event specs)
    // Filter by URL path since we want only the track endpoint responses
    const postResponses = responses.filter((r) => r.url.includes('/inspector/segment/v1/track'))

    expect(postResponses.length).toBe(1)
    expect(postResponses[0].status).toBe(200)

    // Verify event spec endpoints were called exactly once each (deduplication working)
    expect(testEventSpecScope.isDone()).toBe(true)
    expect(anotherEventSpecScope.isDone()).toBe(true)

    // Verify track endpoint was called once with all events
    expect(trackScope.isDone()).toBe(true)
  })

  it('should cache failed event spec fetches within a batch', async () => {
    const event1 = createTestEvent({
      event: 'NonExistentEvent',
      anonymousId: 'test-anon-id-2'
    })
    const event2 = createTestEvent({
      event: 'NonExistentEvent',
      anonymousId: 'test-anon-id-2'
    })

    // Mock event spec endpoint to fail - should only be called once despite two events
    // The failed fetch (null) should be cached and reused for the second event
    const eventSpecScope = nock('https://api.avo.app')
      .get('/trackingPlan/eventSpec')
      .query((query) => query.eventName === 'NonExistentEvent' && query.streamId === 'test-anon-id-2')
      .once() // Should be called exactly once, not twice
      .reply(404, { error: 'Not found' })

    // Mock track endpoint - should still receive both events
    const trackScope = nock('https://api.avo.app')
      .post('/inspector/segment/v1/track', (body) => {
        // Body may be a string (JSON) or already parsed object depending on nock version
        const events = Array.isArray(body) ? body : typeof body === 'string' ? JSON.parse(body) : body
        return Array.isArray(events) && events.length === 2
      })
      .reply(200, {})

    const responses = await testDestination.testBatchAction('sendSchemaToInspector', {
      events: [event1, event2],
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        env: 'dev'
      }
    })

    // Filter to only POST responses (ignore GET requests for event specs)
    // Filter by URL path since we want only the track endpoint responses
    const postResponses = responses.filter((r) => r.url.includes('/inspector/segment/v1/track'))

    expect(postResponses.length).toBe(1)
    expect(postResponses[0].status).toBe(200)

    // Verify event spec endpoint was called only once (failed fetch cached as null)
    expect(eventSpecScope.isDone()).toBe(true)

    // Verify track endpoint was called with both events
    expect(trackScope.isDone()).toBe(true)
  })
})
