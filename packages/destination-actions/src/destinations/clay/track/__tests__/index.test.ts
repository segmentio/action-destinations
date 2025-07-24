import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination, { CLAY_API_BASE_URL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Clay.track', () => {
  it('sends track event to Clay with correct payload', async () => {
    nock(CLAY_API_BASE_URL).post('/segment/test_connection_key/events').reply(200, {})

    const responses = await testDestination.testAction('track', {
      settings: {
        connection_key: 'test_connection_key',
        secret_key: 'test_secret_key'
      },
      mapping: {
        type: 'track',
        timestamp: '2023-03-03T00:00:00.000Z',
        event: 'Purchase Completed',
        properties: {
          product_id: 'prod_123',
          price: 29.99,
          currency: 'USD',
          category: 'Electronics'
        },
        userId: 'user_456',
        anonymousId: 'anonymous_user_123',
        ip: '192.168.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        messageId: 'segment_message_789'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test_secret_key')

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      type: 'track',
      timestamp: '2023-03-03T00:00:00.000Z',
      event: 'Purchase Completed',
      properties: {
        product_id: 'prod_123',
        price: 29.99,
        currency: 'USD',
        category: 'Electronics'
      },
      userId: 'user_456',
      anonymousId: 'anonymous_user_123',
      ip: '192.168.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      messageId: 'segment_message_789'
    })
  })

  it('handles minimal required fields', async () => {
    nock(CLAY_API_BASE_URL).post('/segment/test_connection_key/events').reply(200, {})

    const responses = await testDestination.testAction('track', {
      settings: {
        connection_key: 'test_connection_key',
        secret_key: 'test_secret_key'
      },
      mapping: {
        type: 'track',
        event: 'Button Click',
        ip: '192.168.0.1',
        messageId: 'segment_message_minimal'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test_secret_key')

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      type: 'track',
      event: 'Button Click',
      ip: '192.168.0.1',
      messageId: 'segment_message_minimal'
    })
  })
})
