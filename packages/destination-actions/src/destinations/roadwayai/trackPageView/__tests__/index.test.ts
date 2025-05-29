import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Roadwayai.trackPageView', () => {
  it('should send page view event to RoadwayAI API', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, { success: true })

    const event = createTestEvent({
      type: 'page',
      properties: {
        url: 'https://example.com/page',
        referrer: 'https://google.com',
        title: 'Example Page'
      },
      userId: 'user-123',
      anonymousId: 'anon-456',
      messageId: 'msg-789'
    })

    const mapping = {
      url: {
        '@path': '$.properties.url'
      },
      referrer: {
        '@path': '$.properties.referrer'
      },
      id: {
        '@path': '$.userId'
      },
      anonymous_id: {
        '@path': '$.anonymousId'
      },
      event_id: {
        '@path': '$.messageId'
      },
      timestamp: {
        '@path': '$.timestamp'
      },
      data: {
        '@path': '$.properties'
      }
    }

    const settings = {
      apiKey: 'test-api-key'
    }

    const responses = await testDestination.testAction('trackPageView', {
      event,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toEqual([
      {
        url: 'https://example.com/page',
        referrer: 'https://google.com',
        id: 'user-123',
        anonymous_id: 'anon-456',
        event_id: 'msg-789',
        data: {
          url: 'https://example.com/page',
          referrer: 'https://google.com',
          title: 'Example Page'
        }
      }
    ])
    expect(responses[0].options.headers).toEqual({
      'x-api-key': 'test-api-key'
    })
  })

  it('should handle batch page view events', async () => {
    nock('https://app.roadwayai.com').post('/api/v1/segment/events/page').reply(200, { success: true })

    const events = [
      createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com/page1',
          title: 'Page 1'
        },
        userId: 'user-1'
      }),
      createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com/page2',
          title: 'Page 2'
        },
        userId: 'user-2'
      })
    ]

    const settings = {
      apiKey: 'test-api-key'
    }

    const mapping = {
      url: {
        '@path': '$.properties.url'
      },
      id: {
        '@path': '$.userId'
      },
      data: {
        '@path': '$.properties'
      }
    }

    const responses = await testDestination.testBatchAction('trackPageView', {
      events,
      mapping,
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        url: 'https://example.com/page1',
        id: 'user-1'
      })
    )
    expect(responses[0].options.json).toContainEqual(
      expect.objectContaining({
        url: 'https://example.com/page2',
        id: 'user-2'
      })
    )
  })
})
