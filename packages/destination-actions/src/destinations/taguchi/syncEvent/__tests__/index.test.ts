import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Taguchi.syncEvent', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should work with required fields', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      userId: 'test-user-123',
      properties: {
        total: 123.5,
        products: [
          {
            sku: '1290W',
            price: 123.5
          }
        ],
        email: 'test@example.com'
      }
    })

    nock('https://api.taguchi.com.au')
      .post('/subscriber')
      .reply(200, [
        {
          code: 200,
          name: 'Success',
          description: 'Event processed successfully'
        }
      ])

    const responses = await testDestination.testAction('syncEvent', {
      event,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        target: {
          ref: event.userId as string,
          email: event.properties?.email as string
        },
        eventType: 'p',
        eventData: {
          total: event.properties?.total as number,
          products: event.properties?.products as Array<{ sku: string; price: number }>
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should handle batch requests', async () => {
    const events = [
      createTestEvent({
        type: 'track',
        event: 'Order Completed',
        userId: 'user-1',
        properties: {
          total: 100.0,
          products: [{ sku: 'SKU1', price: 100.0 }],
          email: 'user1@example.com'
        }
      }),
      createTestEvent({
        type: 'track',
        event: 'Order Completed',
        userId: 'user-2',
        properties: {
          total: 200.0,
          products: [{ sku: 'SKU2', price: 200.0 }],
          email: 'user2@example.com'
        }
      })
    ]

    nock('https://api.taguchi.com.au')
      .post('/subscriber')
      .reply(200, [
        { code: 200, name: 'Success', description: 'Event 1 processed' },
        { code: 200, name: 'Success', description: 'Event 2 processed' }
      ])

    const responses = await testDestination.testBatchAction('syncEvent', {
      events,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        target: {
          ref: { '@path': '$.userId' },
          email: { '@path': '$.properties.email' }
        },
        eventType: 'p',
        eventData: {
          total: { '@path': '$.properties.total' },
          products: { '@path': '$.properties.products' }
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })

  it('should validate required target identifier', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      properties: {
        total: 123.5,
        products: [{ sku: '1290W', price: 123.5 }]
      }
    })

    await expect(
      testDestination.testAction('syncEvent', {
        event,
        settings: {
          apiKey: 'test-api-key',
          integrationURL: 'https://api.taguchi.com.au',
          organizationId: '123'
        },
        mapping: {
          target: {},
          eventType: 'p',
          eventData: {
            total: event.properties?.total as number,
            products: event.properties?.products as Array<{ sku: string; price: number }>
          }
        }
      })
    ).rejects.toThrowError('At least one target identifier is required.')
  })

  it('should work with empty event data', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Custom Event',
      userId: 'test-user-123'
    })

    nock('https://api.taguchi.com.au')
      .post('/subscriber')
      .reply(200, [
        {
          code: 200,
          name: 'Success',
          description: 'Event processed successfully'
        }
      ])

    const responses = await testDestination.testAction('syncEvent', {
      event,
      settings: {
        apiKey: 'test-api-key',
        integrationURL: 'https://api.taguchi.com.au',
        organizationId: '123'
      },
      mapping: {
        target: {
          ref: event.userId as string
        },
        eventType: 'p',
        eventData: {}
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
  })
})
