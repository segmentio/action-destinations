import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'submitPageEvent'

describe('SalesWings', () => {
  describe(actionName, () => {
    it('should submit event on Page event', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com',
          title: 'Example Page',
          referrer: 'https://example.com/other'
        },
        context: {
          userAgent
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        messageID: event.messageId,
        userID: event.userId,
        anonymousID: event.anonymousId,
        url: 'https://example.com',
        title: 'Example Page',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: event.timestamp
      })
    })

    it('should submit event on Page event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        messageID: event.messageId,
        userID: event.userId,
        anonymousID: event.anonymousId,
        url: 'https://example.com',
        timestamp: event.timestamp
      })
    })

    it('should take page title from the page context when it is not in properties', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        },
        context: {
          page: { title: 'Context Page' }
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        url: 'https://example.com',
        title: 'Context Page'
      })
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
      expect(request).toMatchObject({
        messageID: event.messageId,
        userID: event.userId,
        url: 'https://example.com',
        timestamp: event.timestamp
      })
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
      expect(request).toMatchObject({
        anonymousID: event.anonymousId,
        url: 'https://example.com',
        timestamp: event.timestamp
      })
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
          messageID: events[0].messageId,
          userID: events[0].userId,
          anonymousID: events[0].anonymousId,
          url: 'https://example.com/01',
          timestamp: events[0].timestamp
        },
        {
          messageID: events[1].messageId,
          userID: events[1].userId,
          anonymousID: events[1].anonymousId,
          url: 'https://example.com/02',
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
