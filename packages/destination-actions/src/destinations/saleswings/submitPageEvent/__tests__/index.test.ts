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
          referrer: 'https://example.com/other'
        },
        context: {
          userAgent
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        userID: event.userId,
        anonymousID: event.anonymousId,
        url: 'https://example.com',
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
        userID: event.userId,
        anonymousID: event.anonymousId,
        url: 'https://example.com',
        timestamp: event.timestamp
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
          userID: events[0].userId,
          anonymousID: events[0].anonymousId,
          url: 'https://example.com/01',
          timestamp: events[0].timestamp
        },
        {
          userID: events[1].userId,
          anonymousID: events[1].anonymousId,
          url: 'https://example.com/02',
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
