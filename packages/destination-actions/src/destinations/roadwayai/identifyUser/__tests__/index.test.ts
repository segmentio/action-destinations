import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Roadwayai.identifyUser', () => {
  it('should send identify user event to RoadwayAI API', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user-123',
      anonymousId: 'anon-456',
      traits: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30,
        plan: 'premium'
      },
      context: {
        ip: '127.0.0.1'
      }
    })

    const mapping = {
      user_id: {
        '@path': '$.userId'
      },
      anonymous_id: {
        '@path': '$.anonymousId'
      },
      traits: {
        '@path': '$.traits'
      },
      timestamp: {
        '@path': '$.timestamp'
      },
      ip: {
        '@path': '$.context.ip'
      }
    }

    const settings = {
      apiKey: 'test-api-key'
    }

    const responses = await testDestination.testAction('identifyUser', {
      event,
      mapping,
      settings
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toEqual([
      {
        user_id: 'user-123',
        anonymous_id: 'anon-456',
        traits: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          age: 30,
          plan: 'premium'
        },
        ip: '127.0.0.1'
      }
    ])
    expect(responses[0].options.headers).toEqual({
      'x-api-key': 'test-api-key'
    })
  })

  it('should handle batch identify user events', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/identify').reply(200, { success: true })

    const events = [
      createTestEvent({
        type: 'identify',
        userId: 'user-1',
        traits: {
          name: 'User One',
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        type: 'identify',
        userId: 'user-2',
        traits: {
          name: 'User Two',
          email: 'user2@example.com'
        }
      })
    ]

    const settings = {
      apiKey: 'test-api-key'
    }

    const mapping = {
      user_id: {
        '@path': '$.userId'
      },
      traits: {
        '@path': '$.traits'
      }
    }

    const responses = await testDestination.testBatchAction('identifyUser', {
      events,
      mapping,
      settings
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        user_id: 'user-1',
        traits: {
          name: 'User One',
          email: 'user1@example.com'
        }
      })
    )
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        user_id: 'user-2',
        traits: {
          name: 'User Two',
          email: 'user2@example.com'
        }
      })
    )
  })
})
