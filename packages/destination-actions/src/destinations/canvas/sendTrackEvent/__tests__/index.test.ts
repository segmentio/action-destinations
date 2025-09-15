import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'sendTrackEvent'

describe('Canvas', () => {
  describe(actionName, () => {
    it('should submit event on Track event', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        },
        context: {
          userAgent,
          page: {
            url: 'https://example.com',
            referrer: 'https://example.com/other'
          }
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toEqual([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          enable_batching: true,
          properties: {
            plan: 'Pro Annual',
            accountType: 'Facebook'
          },
          context: {
            userAgent,
            page: {
              url: 'https://example.com',
              referrer: 'https://example.com/other'
            }
          },
          event: 'User Registered',
          timestamp: event.timestamp,
          sent_at: event.sentAt,
          received_at: event.receivedAt,
          message_id: event.messageId
        }
      ])
    })

    it('should submit event on Track event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered'
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

    it('should submit event on Track event with email in properties', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          email: 'peter@example.com'
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          properties: {
            email: 'peter@example.com'
          },
          timestamp: event.timestamp
        }
      ])
    })

    it('should submit event on Track event with email in properties and without ids', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          email: 'peter@example.com'
        },
        userId: undefined,
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          properties: {
            email: 'peter@example.com'
          },
          event: 'User Registered',
          timestamp: event.timestamp
        }
      ])
    })

    it('should not skip an event with userId only', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          event: 'User Registered',
          timestamp: event.timestamp
        }
      ])
    })

    it('should not skip an event with anonymousId only', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        userId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          anonymous_id: event.anonymousId,
          event: 'User Registered',
          timestamp: event.timestamp
        }
      ])
    })

    it('should submit event batch', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'User Registered'
        }),
        createTestEvent({
          type: 'track',
          event: 'Order Completed'
        })
      ]
      const request = await testBatchAction(actionName, events)
      expect(request).toMatchObject([
        {
          user_id: events[0].userId,
          anonymous_id: events[0].anonymousId,
          event: 'User Registered',
          timestamp: events[0].timestamp
        },
        {
          user_id: events[1].userId,
          anonymous_id: events[1].anonymousId,
          event: 'Order Completed',
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
