import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

let testDestination = createTestIntegration(Destination)

describe('Taguchi.syncAudience', () => {
  beforeEach(() => {
    nock.cleanAll()
    testDestination = createTestIntegration(Destination)
  })

  it('should work with required fields', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-123',
      traits: {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    })

    const json = [
      {
        profile: {
          organizationId: 123,
          ref: "test-user-123",
          email: "test@example.com",
          firstname: "John",
          lastname: "Doe"
        }
      }
    ]

    nock('https://api.taguchi.com.au')
      .post('/subscriber', json)
      .reply(200, [
        {
          code: 200,
          name: 'Success',
          description: 'Subscriber processed successfully'
        }
      ])

    const responses = await testDestination.testAction('syncUserProfile', {
      event,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        identifiers: {
          ref: { '@path': '$.userId' },
          email: { '@path': '$.traits.email' }
        },
        traits: {
          firstname: { '@path': '$.traits.first_name' },
          lastname: { '@path': '$.traits.last_name' }
        },
        timestamp: { '@path': '$.timestamp' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should handle batch requests', async () => {
    const events = [
      createTestEvent({
        type: 'identify',
        userId: 'user-1',
        traits: {
          email: 'user1@example.com',
          first_name: 'John',
          last_name: 'Doe'
        }
      }),
      createTestEvent({
        type: 'identify',
        userId: 'user-2',
        traits: {
          email: 'user2@example.com',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      })
    ]

    const json = [
      {
        profile: {
          organizationId: 123,
          ref: "user-1",
          email: "user1@example.com",
          firstname: "John",
          lastname: "Doe"
        }
      },
      {
        profile: {
          organizationId: 123,
          ref: "user-2",
          email: "user2@example.com",
          firstname: "Jane",
          lastname: "Smith"
        }
      }
    ]

    nock('https://api.taguchi.com.au')
      .post('/subscriber', json)
      .reply(200, [
        { code: 200, name: 'Success', description: 'User 1 processed' },
        { code: 200, name: 'Success', description: 'User 2 processed' }
      ])

    const responses = await testDestination.testBatchAction('syncUserProfile', {
      events,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        identifiers: {
          ref: { '@path': '$.userId' },
          email: { '@path': '$.traits.email' }
        },
        traits: {
          firstname: { '@path': '$.traits.first_name' },
          lastname: { '@path': '$.traits.last_name' }
        },
        timestamp: { '@path': '$.timestamp' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should validate required identifiers', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        first_name: 'John',
        last_name: 'Doe'
      }
    })

    await expect(
      testDestination.testAction('syncUserProfile', {
        event,
        settings: {
          apiKey: 'test-api-key',
          integrationURL: 'https://api.taguchi.com.au',
          organizationId: '123'
        },
        mapping: {
          identifiers: {},
          traits: {
            firstname: { '@path': '$.traits.first_name' },
            lastname: { '@path': '$.traits.last_name' }
          },
          timestamp: { '@path': '$.timestamp' }
        }
      })
    ).rejects.toThrowError('At least one identifier is required.')
  })

  it('should work with list subscriptions', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-123',
      traits: {
        email: 'test@example.com'
      },
      timestamp: "2025-08-28T12:00:25.282Z"
    })

    const json = [
      {
        profile: {
          organizationId: 123,
          ref: "test-user-123",
          email: "test@example.com",
          lists: [
            { listId: 123, unsubscribedTimestamp: null },
            { listId: 456, unsubscribedTimestamp: null },
            { listId: 789, unsubscribedTimestamp: "2025-08-28T12:00:25.282Z" }
          ]
        }
      }
    ]

    nock('https://api.taguchi.com.au')
      .post('/subscriber', json)
      .reply(200, [
        {
          code: 200,
          name: 'Success',
          description: 'Subscriber processed successfully'
        }
      ])

    const responses = await testDestination.testAction('syncUserProfile', {
      event,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        identifiers: {
          ref: { '@path': '$.userId' },
          email: { '@path': '$.traits.email' }
        },
        subscribeLists: [123, 456],
        unsubscribeLists: [789],
        timestamp: {'@path': '$.timestamp'}
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should work with all traits fields', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-123',
      traits: {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        title: 'Mr',
        birthday: '1990-01-01T00:00:00.000Z',
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postal_code: '12345',
        phone: '555-1234',
        gender: 'Male'
      }
    })

    const json = [
      {
        profile: {
          organizationId: 123,
          ref: "test-user-123",
          email: "test@example.com",
          title: "Mr",
          firstname: "John",
          lastname: "Doe",
          dob: "1990-01-01T00:00:00.000Z",
          address: "123 Main St",
          suburb: "Test City",
          state: "Test State",
          country: "Test Country",
          postcode: "12345",
          gender: "Male"
        }
      }
    ]

    nock('https://api.taguchi.com.au')
      .post('/subscriber', json)
      .reply(200, [
        {
          code: 200,
          name: 'Success',
          description: 'Subscriber processed successfully'
        }
      ])

    const responses = await testDestination.testAction('syncUserProfile', {
      event,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        identifiers: {
          ref: event.userId as string,
          email: event.traits?.email as string
        },
        traits: {
          title: event.traits?.title as string,
          firstname: event.traits?.first_name as string,
          lastname: event.traits?.last_name as string,
          dob: event.traits?.birthday as string,
          address: event.traits?.street as string,
          suburb: event.traits?.city as string,
          state: event.traits?.state as string,
          country: event.traits?.country as string,
          postcode: event.traits?.postal_code as string,
          gender: event.traits?.gender as string
        },
        timestamp: event.timestamp
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
