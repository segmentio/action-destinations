import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'sendScreenEvent'

describe('Canvas', () => {
  describe(actionName, () => {
    it('should submit event on Screen event', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        properties: {
          'Random prop': 'cool guy'
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
          name: 'Home',
          timestamp: event.timestamp,
          properties: {
            'Random prop': 'cool guy'
          },
          context: {
            userAgent,
            page: {
              url: 'https://example.com',
              referrer: 'https://example.com/other'
            }
          }
        }
      ])
    })

    it('should submit event on Screen event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home'
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          name: 'Home',
          timestamp: event.timestamp
        }
      ])
    })

    it('should not skip an event with userId only', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          name: 'Home',
          timestamp: event.timestamp
        }
      ])
    })

    it('should not skip an event with anonymousId only', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        userId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          anonymous_id: event.anonymousId,
          name: 'Home',
          timestamp: event.timestamp
        }
      ])
    })

    it('should submit event batch', async () => {
      const events = [
        createTestEvent({
          type: 'screen',
          name: 'Home'
        }),
        createTestEvent({
          type: 'screen',
          name: 'Orders'
        })
      ]
      const request = await testBatchAction(actionName, events)
      expect(request).toMatchObject([
        {
          user_id: events[0].userId,
          anonymous_id: events[0].anonymousId,
          name: 'Home',
          timestamp: events[0].timestamp
        },
        {
          user_id: events[1].userId,
          anonymous_id: events[1].anonymousId,
          name: 'Orders',
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
