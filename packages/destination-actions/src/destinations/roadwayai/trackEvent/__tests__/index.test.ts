import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const ROADWAY_API_KEY = 'test-api-key'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Roadwayai.trackEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      properties: {
        test_property: 'test_value'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        event: 'Test Event',
        event_properties: expect.objectContaining({
          test_property: 'test_value'
        })
      })
    ])
  })

  it('should handle custom mapping', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'Custom Event',
      properties: {
        custom_prop: 'custom_value'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      mapping: {
        event: {
          '@path': '$.event'
        },
        timestamp: {
          '@path': '$.timestamp'
        },
        event_properties: {
          '@path': '$.properties'
        }
      },
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        event: 'Custom Event',
        event_properties: expect.objectContaining({
          custom_prop: 'custom_value'
        })
      })
    ])
  })

  it('should handle events with user_id', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      userId: 'user123',
      properties: {
        test_property: 'test_value'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        event: 'Test Event',
        user_id: 'user123'
      })
    ])
  })

  it('should handle events with anonymous_id', async () => {
    const event = createTestEvent({
      timestamp,
      event: 'Test Event',
      anonymousId: 'anon123',
      properties: {
        test_property: 'test_value'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, {})

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        event: 'Test Event',
        anonymous_id: 'anon123'
      })
    ])
  })

  it('should require event field', async () => {
    const event = createTestEvent({ timestamp })
    event.event = undefined

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, {})

    try {
      await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: ROADWAY_API_KEY
        }
      })
    } catch (e) {
      expect(e.message).toBe("The root value is missing the required field 'event'.")
    }
  })

  it('should invoke performBatch for batches', async () => {
    const events = [
      createTestEvent({
        timestamp,
        event: 'Test Event1',
        properties: { prop1: 'value1' }
      }),
      createTestEvent({
        timestamp,
        event: 'Test Event2',
        properties: { prop2: 'value2' }
      })
    ]

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/track').reply(200, {})

    const responses = await testDestination.testBatchAction('trackEvent', {
      events,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.json).toMatchObject([
      expect.objectContaining({
        event: 'Test Event1',
        event_properties: expect.objectContaining({
          prop1: 'value1'
        })
      }),
      expect.objectContaining({
        event: 'Test Event2',
        event_properties: expect.objectContaining({
          prop2: 'value2'
        })
      })
    ])
  })
})
