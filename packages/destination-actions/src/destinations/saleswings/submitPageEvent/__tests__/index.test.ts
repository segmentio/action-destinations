import { createTestEvent } from '@segment/actions-core'
import { expectedTs, testAction, testActionWithSkippedEvent, testBatchAction, userAgent } from '../../testing'

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
        type: 'page-visit',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: expectedTs(event.timestamp)
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
        type: 'page-visit',
        leadRefs: [
          { type: 'client-id', value: event.userId },
          { type: 'client-id', value: event.anonymousId }
        ],
        url: 'https://example.com',
        timestamp: expectedTs(event.timestamp)
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
        type: 'page-visit',
        leadRefs: [{ type: 'client-id', value: event.userId }],
        url: 'https://example.com',
        timestamp: expectedTs(event.timestamp)
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
        type: 'page-visit',
        leadRefs: [{ type: 'client-id', value: event.anonymousId }],
        url: 'https://example.com',
        timestamp: expectedTs(event.timestamp)
      })
    })

    it('should skip an event without any ids', async () => {
      const event = createTestEvent({
        type: 'page',
        properties: {
          url: 'https://example.com'
        },
        anonymousId: undefined,
        userId: undefined
      })
      await testActionWithSkippedEvent(actionName, event)
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
      expect(request).toMatchObject({
        events: [
          {
            type: 'page-visit',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId }
            ],
            url: 'https://example.com/01',
            timestamp: expectedTs(events[0].timestamp)
          },
          {
            type: 'page-visit',
            leadRefs: [
              { type: 'client-id', value: events[0].userId },
              { type: 'client-id', value: events[0].anonymousId }
            ],
            url: 'https://example.com/02',
            timestamp: expectedTs(events[1].timestamp)
          }
        ]
      })
    })
  })
})
