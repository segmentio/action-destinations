import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'submitTrackEvent'

describe('SalesWings', () => {
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
      expect(request).toMatchObject({
        userID: event.userId,
        anonymousID: event.anonymousId,
        kind: 'Track',
        data: 'User Registered',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: event.timestamp,
        values: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        }
      })
    })

    it('should submit event on Track event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered'
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        userID: event.userId,
        anonymousID: event.anonymousId,
        kind: 'Track',
        data: 'User Registered',
        timestamp: event.timestamp
      })
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
      expect(request).toMatchObject({
        userID: event.userId,
        anonymousID: event.anonymousId,
        email: 'peter@example.com',
        kind: 'Track',
        data: 'User Registered',
        timestamp: event.timestamp,
        values: {}
      })
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
      expect(request).toMatchObject({
        email: 'peter@example.com',
        kind: 'Track',
        data: 'User Registered',
        timestamp: event.timestamp,
        values: {}
      })
    })

    it('should not skip an event with userId only', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        userID: event.userId,
        kind: 'Track',
        data: 'User Registered',
        timestamp: event.timestamp,
        values: {}
      })
    })

    it('should not skip an event with anonymousId only', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        userId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        anonymousID: event.anonymousId,
        kind: 'Track',
        data: 'User Registered',
        timestamp: event.timestamp,
        values: {}
      })
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
          userID: events[0].userId,
          anonymousID: events[0].anonymousId,
          kind: 'Track',
          data: 'User Registered',
          timestamp: events[0].timestamp
        },
        {
          userID: events[1].userId,
          anonymousID: events[1].anonymousId,
          kind: 'Track',
          data: 'Order Completed',
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
