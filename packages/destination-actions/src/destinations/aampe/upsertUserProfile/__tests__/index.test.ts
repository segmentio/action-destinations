import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { SingaporeURL } from '../../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  apiKey: 'test-api-key',
  region: SingaporeURL
}

const receivedAt = '2023-01-01T00:00:00.000Z'

describe('Aampe.upsertUserProfile', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should upsert user profile with required fields', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com',
        name: 'Test User'
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          email: 'test@example.com',
          name: 'Test User'
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'identify',
      timestamp: expect.any(Number),
      user_properties: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })
  })

  it('should convert timestamp to Unix timestamp', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com'
      },
      timestamp: '2023-01-01T00:00:00.000Z',
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          email: 'test@example.com'
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect((responses[0].options.json as any).timestamp).toBe(1672531200) // Unix timestamp for 2023-01-01T00:00:00.000Z
  })

  it('should include optional fields when provided', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com',
        name: 'Test User'
      },
      messageId: 'msg-123',
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          email: 'test@example.com',
          name: 'Test User'
        },
        event_id: 'msg-123'
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'identify',
      timestamp: expect.any(Number),
      user_properties: {
        email: 'test@example.com',
        name: 'Test User'
      },
      event_id: 'msg-123'
    })
  })

  it('should handle missing optional fields gracefully', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com'
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          email: 'test@example.com'
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'identify',
      timestamp: expect.any(Number),
      user_properties: {
        email: 'test@example.com'
      }
    })
    expect((responses[0].options.json as any).metadata).toBeUndefined()
    expect((responses[0].options.json as any).event_id).toBeUndefined()
  })

  it('should use anonymousId when userId is not available', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      anonymousId: 'anon123',
      userId: undefined,
      traits: {
        anonymous: true
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'anon123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          anonymous: true
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect((responses[0].options.json as any).contact_id).toBe('anon123')
  })

  it('should handle complex user properties', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        isSubscribed: true,
        preferences: {
          theme: 'dark',
          notifications: true
        },
        tags: ['premium', 'verified'],
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA'
        }
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          email: 'test@example.com',
          name: 'Test User',
          age: 25,
          isSubscribed: true,
          preferences: {
            theme: 'dark',
            notifications: true
          },
          tags: ['premium', 'verified'],
          address: {
            street: '123 Main St',
            city: 'New York',
            country: 'USA'
          }
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'identify',
      timestamp: expect.any(Number),
      user_properties: {
        email: 'test@example.com',
        name: 'Test User',
        age: 25,
        isSubscribed: true,
        preferences: {
          theme: 'dark',
          notifications: true
        },
        tags: ['premium', 'verified'],
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA'
        }
      }
    })
  })

  it('should handle custom mappings', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com'
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'custom_user',
        event_name: 'profile_update',
        timestamp: '2023-01-01T12:00:00.000Z',
        metadata: {
          source: 'segment'
        },
        event_id: 'profile-event-id',
        user_properties: {
          email: 'custom@example.com',
          status: 'active',
          plan: 'premium'
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'custom_user',
      event_name: 'profile_update',
      timestamp: expect.any(Number),
      metadata: {
        source: 'segment'
      },
      event_id: 'profile-event-id',
      user_properties: {
        email: 'custom@example.com',
        status: 'active',
        plan: 'premium'
      }
    })
  })

  it('should handle empty traits', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {},
      receivedAt
    })

    await expect(
      testDestination.testAction('upsertUserProfile', {
        event,
        settings,
        mapping: {
          contact_id: 'user123',
          event_name: 'identify',
          timestamp: '2023-01-01T00:00:00.000Z',
          user_properties: {}
        }
      })
    ).rejects.toThrowError('Upsert User Profile action requires at least one user property to be set')
  })

  it('should handle error responses', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(400, { error: 'Bad Request' })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com'
      },
      receivedAt
    })

    await expect(
      testDestination.testAction('upsertUserProfile', {
        event,
        settings,
        mapping: {
          contact_id: 'user123',
          event_name: 'identify',
          timestamp: '2023-01-01T00:00:00.000Z',
          user_properties: {
            email: 'test@example.com'
          }
        }
      })
    ).rejects.toThrow()
  })

  it('should include proper authorization header', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com'
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          email: 'test@example.com'
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test-api-key')
  })

  it('should handle different data types in user properties', async () => {
    nock('https://ingestion-service-asia-southeast1-toqowp62ka-as.a.run.app')
      .post('/v1/properties')
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        string_prop: 'string value',
        number_prop: 42,
        boolean_prop: true,
        null_prop: null,
        array_prop: [1, 2, 3],
        object_prop: { nested: 'value' }
      },
      receivedAt
    })

    const responses = await testDestination.testAction('upsertUserProfile', {
      event,
      settings,
      mapping: {
        contact_id: 'user123',
        event_name: 'identify',
        timestamp: '2023-01-01T00:00:00.000Z',
        user_properties: {
          string_prop: 'string value',
          number_prop: 42,
          boolean_prop: true,
          null_prop: null,
          array_prop: [1, 2, 3],
          object_prop: { nested: 'value' }
        }
      }
    })

    expect(responses.length).toBeGreaterThan(0)
    expect(responses[0].options.json).toMatchObject({
      contact_id: 'user123',
      event_name: 'identify',
      timestamp: expect.any(Number),
      user_properties: {
        string_prop: 'string value',
        number_prop: 42,
        boolean_prop: true,
        null_prop: null,
        array_prop: [1, 2, 3],
        object_prop: { nested: 'value' }
      }
    })
  })
})
