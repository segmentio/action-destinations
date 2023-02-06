import { createTestEvent } from '@segment/actions-core'
import {
  expectedTs,
  testAction,
  testActionWithSkippedEvent,
  testBatchAction,
  testBatchActionSkippedEvents,
  userAgent
} from '../../testing'

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
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'Track',
        data: 'User Registered',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp),
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
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should skip event without any id', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        userId: undefined,
        anonymousId: undefined
      })
      await testActionWithSkippedEvent(actionName, event)
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
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId },
          { type: 'email', value: 'peter@example.com' }
        ],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
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
        type: 'tracking',
        leadRefs: [{ type: 'email', value: 'peter@example.com' }],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
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
        type: 'tracking',
        leadRefs: [{ type: 'client-id', value: event.userId }],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
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
        type: 'tracking',
        leadRefs: [{ type: 'client-id', value: event.anonymousId }],
        kind: 'Track',
        data: 'User Registered',
        timestamp: expectedTs(event.timestamp),
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
      expect(request).toMatchObject({
        events: [
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId }
            ],
            kind: 'Track',
            data: 'User Registered',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          },
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[1].userId },
              { type: 'client-id', value: events[1].anonymousId }
            ],
            kind: 'Track',
            data: 'Order Completed',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          }
        ]
      })
    })

    it('should not include skippable events into a batch', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'User Registered'
        }),
        createTestEvent({
          type: 'track',
          event: 'Order Purchased'
        }),
        createTestEvent({
          type: 'track',
          event: 'Cart Abandonned',
          userId: undefined,
          anonymousId: undefined
        })
      ]
      const request = await testBatchAction(actionName, events)
      expect(request).toMatchObject({
        events: [
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId }
            ],
            kind: 'Track',
            data: 'User Registered',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          },
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[1].userId },
              { type: 'client-id', value: events[1].anonymousId }
            ],
            kind: 'Track',
            data: 'Order Purchased',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          }
        ]
      })
    })

    it('should not submit a batch if all the events are skippable', async () => {
      const events = [
        createTestEvent({
          type: 'track',
          event: 'User Registered',
          userId: undefined,
          anonymousId: undefined
        }),
        createTestEvent({
          type: 'track',
          event: 'Order Purchased',
          userId: undefined,
          anonymousId: undefined
        }),
        createTestEvent({
          type: 'track',
          event: 'Cart Abandonned',
          userId: undefined,
          anonymousId: undefined
        })
      ]
      await testBatchActionSkippedEvents(actionName, events)
    })
  })
})
