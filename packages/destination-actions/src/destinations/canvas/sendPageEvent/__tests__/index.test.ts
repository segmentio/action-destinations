import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'sendPageEvent'

describe('Canvas', () => {
  describe(actionName, () => {
    it('should submit event on Page event', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com',
          referrer: 'https://example.com/other'
        },
        context: {
          userAgent
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          properties: {
            url: 'https://example.com',
            referrer: 'https://example.com/other'
          },
          context: {
            userAgent
          },
          timestamp: event.timestamp
        }
      ])
    })

    it('should submit event on Page event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          timestamp: event.timestamp
        }
      ])
    })

    it('should not skip an event with userId only', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        },
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          properties: {
            url: 'https://example.com'
          },
          timestamp: event.timestamp
        }
      ])
    })

    it('should not skip an event with anonymousId only', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        },
        userId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          anonymous_id: event.anonymousId,
          properties: {
            url: 'https://example.com'
          },
          timestamp: event.timestamp
        }
      ])
    })

    it('should submit event batch', async () => {
      const events = [
        createTestEvent({
          type: 'page',
          context: {
            page: { url: 'https://example.com/01' }
          }
        }),
        createTestEvent({
          type: 'page',
          context: {
            page: { url: 'https://example.com/02' }
          }
        })
      ]
      const request = await testBatchAction(actionName, events)
      expect(request).toMatchObject([
        {
          user_id: events[0].userId,
          anonymous_id: events[0].anonymousId,
          timestamp: events[0].timestamp,
          context: {
            page: { url: 'https://example.com/01' }
          }
        },
        {
          user_id: events[1].userId,
          anonymous_id: events[1].anonymousId,
          context: {
            page: { url: 'https://example.com/02' }
          },
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
