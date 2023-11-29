import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'sendIdentifyEvent'

describe('Canvas', () => {
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
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          timestamp: event.timestamp,
          context: {
            userAgent,
            page: {
              url: 'https://example.com',
              referrer: 'https://example.com/other'
            }
          },
          traits: {
            name: 'Peter Gibbons',
            email: 'peter@example.com',
            plan: 'premium',
            logins: 5
          }
        }
      ])
    })

    it('should submit event on Identify event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'identify',
        traits: {
          email: 'peter@example.com'
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          timestamp: event.timestamp,
          traits: {
            email: 'peter@example.com'
          }
        }
      ])
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
          user_id: events[0].userId,
          anonymous_id: events[0].anonymousId,
          traits: {
            email: 'peter@example.com'
          },
          timestamp: events[0].timestamp
        },
        {
          user_id: events[1].userId,
          anonymous_id: events[1].anonymousId,
          traits: {
            email: 'frank@example.com'
          },
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
