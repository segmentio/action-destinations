import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const ROADWAY_API_KEY = 'test-api-key'
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Roadwayai.identifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'identify',
      timestamp,
      userId: 'user123',
      traits: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
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
        user_id: 'user123',
        traits: expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com'
        })
      })
    ])
  })

  it('should send request with correct headers', async () => {
    const event = createTestEvent({
      type: 'identify',
      timestamp,
      userId: 'user123',
      traits: {
        name: 'John Doe'
      }
    })

    nock('https://app.roadwayai.com')
      .post('/api/v1/segment/events/identify')
      .matchHeader('x-api-key', ROADWAY_API_KEY)
      .reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: ROADWAY_API_KEY
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchObject({
      'x-api-key': ROADWAY_API_KEY
    })
  })

  it('should handle custom mapping', async () => {
    const event = createTestEvent({
      type: 'identify',
      timestamp,
      userId: 'customuser',
      traits: {
        custom_name: 'Custom User',
        custom_email: 'custom@example.com'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      mapping: {
        user_id: {
          '@path': '$.userId'
        },
        traits: {
          '@path': '$.traits'
        },
        timestamp: {
          '@path': '$.timestamp'
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
        user_id: 'customuser',
        traits: expect.objectContaining({
          custom_name: 'Custom User',
          custom_email: 'custom@example.com'
        })
      })
    ])
  })

  it('should handle events with anonymous_id', async () => {
    const event = createTestEvent({
      type: 'identify',
      timestamp,
      anonymousId: 'anon123',
      traits: {
        name: 'Anonymous User'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
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
        anonymous_id: 'anon123',
        traits: expect.objectContaining({
          name: 'Anonymous User'
        })
      })
    ])
  })

  it('should handle events with IP address', async () => {
    const event = createTestEvent({
      type: 'identify',
      timestamp,
      userId: 'user123',
      traits: {
        name: 'User with IP'
      },
      context: {
        ip: '192.168.1.1'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
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
        user_id: 'user123',
        ip: '192.168.1.1'
      })
    ])
  })

  it('should handle events with both user_id and anonymous_id', async () => {
    const event = createTestEvent({
      type: 'identify',
      timestamp,
      userId: 'user123',
      anonymousId: 'anon456',
      traits: {
        name: 'Mixed ID User'
      }
    })

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
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
        user_id: 'user123',
        anonymous_id: 'anon456'
      })
    ])
  })

  it('should invoke performBatch for batches', async () => {
    const events = [
      createTestEvent({
        type: 'identify',
        timestamp,
        userId: 'user1',
        traits: {
          name: 'User One',
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        type: 'identify',
        timestamp,
        userId: 'user2',
        traits: {
          name: 'User Two',
          email: 'user2@example.com'
        }
      })
    ]

    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, {})

    const responses = await testDestination.testBatchAction('identifyUser', {
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
        user_id: 'user1',
        traits: expect.objectContaining({
          name: 'User One',
          email: 'user1@example.com'
        })
      }),
      expect.objectContaining({
        user_id: 'user2',
        traits: expect.objectContaining({
          name: 'User Two',
          email: 'user2@example.com'
        })
      })
    ])
  })
})
