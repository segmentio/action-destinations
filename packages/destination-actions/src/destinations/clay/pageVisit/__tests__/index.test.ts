import { createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination, { CLAY_API_BASE_URL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Clay.pageVisit', () => {
  it('sends page event to Clay with correct payload', async () => {
    nock(CLAY_API_BASE_URL).post('/segment/test_connection_key/events').reply(200, {})

    const responses = await testDestination.testAction('pageVisit', {
      settings: {
        connection_key: 'test_connection_key',
        secret_key: 'test_secret_key'
      },
      mapping: {
        timestamp: '2023-03-03T00:00:00.000Z',
        url: 'https://example.com/page',
        page: {
          title: 'Example Page',
          url: 'https://example.com/page',
          path: '/page',
          referrer: 'https://google.com'
        },
        ip: '192.168.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        anonymousId: 'anonymous_user_123',
        userId: 'user_456',
        messageId: 'segment_message_789'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test_secret_key')

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      timestamp: '2023-03-03T00:00:00.000Z',
      url: 'https://example.com/page',
      page: {
        title: 'Example Page',
        url: 'https://example.com/page',
        path: '/page',
        referrer: 'https://google.com'
      },
      ip: '192.168.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      anonymousId: 'anonymous_user_123',
      userId: 'user_456',
      messageId: 'segment_message_789'
    })
  })

  it('handles minimal required fields', async () => {
    nock(CLAY_API_BASE_URL).post('/segment/test_connection_key/events').reply(200, {})

    const responses = await testDestination.testAction('pageVisit', {
      settings: {
        connection_key: 'test_connection_key',
        secret_key: 'test_secret_key'
      },
      mapping: {
        ip: '192.168.0.1',
        messageId: 'segment_message_minimal'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect((responses[0].options.headers as any)?.get?.('authorization')).toBe('Bearer test_secret_key')

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')
    expect(payload).toMatchObject({
      ip: '192.168.0.1',
      messageId: 'segment_message_minimal'
    })
  })
})
