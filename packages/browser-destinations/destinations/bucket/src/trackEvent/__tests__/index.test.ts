import { Analytics, Context, User } from '@segment/analytics-next'
import bucketWebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core/*'
import { bucketTestHooks, getBucketCallLog } from '../../test-utils'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      },
      userId: {
        '@path': '$.userId'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('trackEvent', () => {
  bucketTestHooks()

  describe('when logged in', () => {
    describe('from analytics.js previous session', () => {
      it('maps parameters correctly to Bucket', async () => {
        const [bucketPlugin] = await bucketWebDestination({
          trackingKey: 'testTrackingKey',
          subscriptions: subscriptions as unknown as JSONArray
        })

        const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })
        jest.spyOn(analyticsInstance, 'user').mockImplementation(
          () =>
            ({
              id: () => 'user-id-1'
            } as User)
        )
        await bucketPlugin.load(Context.system(), analyticsInstance)

        jest.spyOn(destination.actions.trackEvent, 'perform')

        const properties = { property1: 'value1', property2: false }
        await bucketPlugin.track?.(
          new Context({
            type: 'track',
            name: 'Button Clicked',
            userId: 'user-id-1',
            properties
          })
        )

        expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            payload: { name: 'Button Clicked', userId: 'user-id-1', properties }
          })
        )

        expect(getBucketCallLog()).toStrictEqual([
          { method: 'init', args: ['testTrackingKey', {}] },
          {
            method: 'user',
            args: ['user-id-1', {}, { active: false }]
          },
          {
            method: 'track',
            args: ['Button Clicked', properties, 'user-id-1']
          }
        ])
      })
    })

    describe('from am identify call', () => {
      it('maps parameters correctly to Bucket', async () => {
        const [bucketPlugin] = await bucketWebDestination({
          trackingKey: 'testTrackingKey',
          subscriptions: subscriptions as unknown as JSONArray
        })

        await bucketPlugin.load(Context.system(), new Analytics({ writeKey: 'test-writekey' }))

        jest.spyOn(destination.actions.trackEvent, 'perform')

        // Bucket rejects group calls without previous identify calls
        await window.bucket.user('user-id-1')

        const properties = { property1: 'value1', property2: false }
        await bucketPlugin.track?.(
          new Context({
            type: 'track',
            name: 'Button Clicked',
            userId: 'user-id-1',
            properties
          })
        )

        expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            payload: { name: 'Button Clicked', userId: 'user-id-1', properties }
          })
        )

        expect(getBucketCallLog()).toStrictEqual([
          { method: 'init', args: ['testTrackingKey', {}] },
          {
            method: 'user',
            args: ['user-id-1']
          },
          {
            method: 'track',
            args: ['Button Clicked', properties, 'user-id-1']
          }
        ])
      })
    })
  })

  describe('when not logged in', () => {
    it('should not call Bucket.group', async () => {
      const [bucketPlugin] = await bucketWebDestination({
        trackingKey: 'testTrackingKey',
        subscriptions: subscriptions as unknown as JSONArray
      })

      const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })
      await bucketPlugin.load(Context.system(), analyticsInstance)

      jest.spyOn(destination.actions.trackEvent, 'perform')

      // Manually mimicking a track call without a userId.
      // The analytics client will probably never do this if
      // userId doesn't exist, since the subscription marks it as required
      const properties = { property1: 'value1', property2: false }
      await bucketPlugin.track?.(
        new Context({
          type: 'track',
          name: 'Button Clicked',
          anonymousId: 'user-id-1',
          properties
        })
      )

      // TODO: Ideally we should be able to assert that the destination action was never
      // called, but couldn't figure out how to create an anlytics instance with the plugin
      // and then trigger the full flow trhough analytics.track() with only an anonymous ID
      // expect(destination.actions.trackEvent.perform).not.toHaveBeenCalled()

      expect(getBucketCallLog()).toStrictEqual([{ method: 'init', args: ['testTrackingKey', {}] }])
    })
  })
})
