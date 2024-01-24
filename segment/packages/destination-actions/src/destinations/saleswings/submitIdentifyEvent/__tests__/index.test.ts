import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

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
        userID: event.userId,
        anonymousID: event.anonymousId,
        email: event.traits?.email,
        kind: 'Identify',
        data: 'peter@example.com',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: event.timestamp,
        values: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
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
        userID: event.userId,
        anonymousID: event.anonymousId,
        email: event.traits?.email,
        kind: 'Identify',
        data: 'peter@example.com',
        timestamp: event.timestamp,
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
      expect(request).toMatchObject([
        {
          userID: events[0].userId,
          anonymousID: events[0].anonymousId,
          email: events[0].traits?.email,
          kind: 'Identify',
          data: 'peter@example.com',
          timestamp: events[0].timestamp
        },
        {
          userID: events[1].userId,
          anonymousID: events[1].anonymousId,
          email: events[1].traits?.email,
          kind: 'Identify',
          data: 'frank@example.com',
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
