import { createTestEvent } from '@segment/actions-core'
import { expectedTs, testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'submitIdentifyEvent'

describe('SalesWings', () => {
  describe(actionName, () => {
    it('should submit event on Identify event', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5
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
          { type: 'client-id', value: event.anonymousId },
          { type: 'email', value: event.traits?.email }
        ],
        kind: 'Identify',
        data: 'peter@example.com',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp),
        values: {
          name: 'Peter Gibbons',
          plan: 'premium',
          logins: 5
        }
      })
    })

    it('should submit event on Identify event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'peter@example.com'
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId },
          { type: 'email', value: event.traits?.email }
        ],
        kind: 'Identify',
        data: 'peter@example.com',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should not skip an event without ids', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'peter@example.com'
        },
        userId: undefined,
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        type: 'tracking',
        leadRefs: [{ type: 'email', value: event.traits?.email }],
        kind: 'Identify',
        data: 'peter@example.com',
        timestamp: expectedTs(event.timestamp),
        values: {}
      })
    })

    it('should submit event batch', async () => {
      const events = [
        createTestEvent({
          type: 'identify',
          traits: {
            email: 'peter@example.com'
          }
        }),
        createTestEvent({
          type: 'identify',
          traits: {
            email: 'frank@example.com'
          }
        })
      ]
      const request = await testBatchAction(actionName, events)
      expect(request).toMatchObject({
        events: [
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId },
              { type: 'email', value: events[0].traits?.email }
            ],
            kind: 'Identify',
            data: 'peter@example.com',
            timestamp: expectedTs(events[0].timestamp),
            values: {}
          },
          {
            type: 'tracking',
            leadRefs: [
              { type: 'client-id', value: events[1].userId },
              { type: 'client-id', value: events[1].anonymousId },
              { type: 'email', value: events[1].traits?.email }
            ],
            kind: 'Identify',
            data: 'frank@example.com',
            timestamp: expectedTs(events[1].timestamp),
            values: {}
          }
        ]
      })
    })
  })
})
