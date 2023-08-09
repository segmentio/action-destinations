import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'sendGroupEvent'

describe('Canvas', () => {
  describe(actionName, () => {
    it('should submit event on Group event', async () => {
      const event = createTestEvent({
        type: 'group',
        groupId: 'magic-man',
        traits: {
          name: 'Magic team',
          email: 'team@magic.com'
        },
        context: {
          userAgent,
          page: {
            url: 'https://magic.com',
            referrer: 'https://magic.com/other'
          }
        }
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          group_id: event.groupId,
          timestamp: event.timestamp,
          traits: {
            name: 'Magic team',
            email: 'team@magic.com'
          },
          context: {
            userAgent,
            page: {
              url: 'https://magic.com',
              referrer: 'https://magic.com/other'
            }
          }
        }
      ])
    })

    it('should submit event on Identify event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'group',
        groupId: 'magic-group'
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject([
        {
          user_id: event.userId,
          anonymous_id: event.anonymousId,
          timestamp: event.timestamp,
          group_id: event.groupId
        }
      ])
    })

    it('should submit event batch', async () => {
      const events = [
        createTestEvent({
          type: 'group',
          groupId: 'cool-group',
          traits: {
            name: 'Cool group'
          }
        }),
        createTestEvent({
          type: 'group',
          groupId: 'uncool-group',
          traits: {
            name: 'Uncool group'
          }
        })
      ]
      const request = await testBatchAction(actionName, events)
      expect(request).toMatchObject([
        {
          group_id: 'cool-group',
          traits: {
            name: 'Cool group'
          },
          user_id: events[0].userId,
          anonymous_id: events[0].anonymousId,
          timestamp: events[0].timestamp
        },
        {
          group_id: 'uncool-group',
          traits: {
            name: 'Uncool group'
          },
          user_id: events[1].userId,
          anonymous_id: events[1].anonymousId,
          timestamp: events[1].timestamp
        }
      ])
    })
  })
})
