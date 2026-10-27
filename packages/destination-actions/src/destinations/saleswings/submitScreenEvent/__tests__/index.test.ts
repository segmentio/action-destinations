import { createTestEvent } from '@segment/actions-core'
import { testAction, testBatchAction, userAgent } from '../../testing'

const actionName = 'submitScreenEvent'

describe('SalesWings', () => {
  describe(actionName, () => {
    it('should submit event on Screen event', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        properties: {
          'Feed Type': 'private'
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
        kind: 'Screen',
        data: 'Home',
        url: 'https://example.com',
        referrerUrl: 'https://example.com/other',
        userAgent,
        timestamp: event.timestamp,
        values: {
          'Feed Type': 'private'
        }
      })
    })

    it('should submit event on Screen event with all optional fields omitted', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home'
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        userID: event.userId,
        anonymousID: event.anonymousId,
        kind: 'Screen',
        data: 'Home',
        timestamp: event.timestamp
      })
    })

    it('should not skip an event with userId only', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        anonymousId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        userID: event.userId,
        kind: 'Screen',
        data: 'Home',
        timestamp: event.timestamp,
        values: {}
      })
    })

    it('should not skip an event with anonymousId only', async () => {
      const event = createTestEvent({
        type: 'screen',
        name: 'Home',
        userId: undefined
      })
      const request = await testAction(actionName, event)
      expect(request).toMatchObject({
        anonymousID: event.anonymousId,
        kind: 'Screen',
        data: 'Home',
        timestamp: event.timestamp,
        values: {}
      })
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
          userID: events[0].userId,
          anonymousID: events[0].anonymousId,
          kind: 'Screen',
          data: 'Home',
          timestamp: events[0].timestamp,
          values: {}
        },
        {
          userID: events[1].userId,
          anonymousID: events[1].anonymousId,
          kind: 'Screen',
          data: 'Orders',
          timestamp: events[1].timestamp,
          values: {}
        }
      ])
    })
  })
})
