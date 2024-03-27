import { Analytics, Context, User } from '@segment/analytics-next'
import bucketWebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core/*'
import { bucketTestHooks, getBucketCallLog } from '../../test-utils'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'group',
    name: 'Identify Company',
    enabled: true,
    subscribe: 'type = "group"',
    mapping: {
      groupId: {
        '@path': '$.groupId'
      },
      userId: {
        '@path': '$.userId'
      },
      traits: {
        '@path': '$.traits'
      }
    }
  }
]

describe('Bucket.company', () => {
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

        jest.spyOn(destination.actions.group, 'perform')

        await bucketPlugin.group?.(
          new Context({
            type: 'group',
            userId: 'user-id-1',
            groupId: 'group-id-1',
            traits: {
              name: 'ACME INC'
            }
          })
        )

        expect(destination.actions.group.perform).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            payload: {
              userId: 'user-id-1',
              groupId: 'group-id-1',
              traits: {
                name: 'ACME INC'
              }
            }
          })
        )

        expect(getBucketCallLog()).toStrictEqual([
          { method: 'init', args: ['testTrackingKey', {}] },
          {
            method: 'user',
            args: ['user-id-1', {}, { active: false }]
          },
          {
            method: 'company',
            args: [
              'group-id-1',
              {
                name: 'ACME INC'
              },
              'user-id-1'
            ]
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

        jest.spyOn(destination.actions.group, 'perform')

        // Bucket rejects group calls without previous identify calls
        await window.bucket.user('user-id-1')

        await bucketPlugin.group?.(
          new Context({
            type: 'group',
            userId: 'user-id-1',
            groupId: 'group-id-1',
            traits: {
              name: 'ACME INC'
            }
          })
        )

        expect(destination.actions.group.perform).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            payload: {
              userId: 'user-id-1',
              groupId: 'group-id-1',
              traits: {
                name: 'ACME INC'
              }
            }
          })
        )

        expect(getBucketCallLog()).toStrictEqual([
          { method: 'init', args: ['testTrackingKey', {}] },
          {
            method: 'user',
            args: ['user-id-1']
          },
          {
            method: 'company',
            args: [
              'group-id-1',
              {
                name: 'ACME INC'
              },
              'user-id-1'
            ]
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

      jest.spyOn(destination.actions.group, 'perform')

      // Manually mimicking a group call without a userId.
      // The analytics client will probably never do this if
      // userId doesn't exist, since the subscription marks it as required
      await bucketPlugin.group?.(
        new Context({
          type: 'group',
          anonymousId: 'anonymous-id-1',
          groupId: 'group-id-1',
          traits: {
            name: 'ACME INC'
          }
        })
      )

      // TODO: Ideally we should be able to assert that the destination action was never
      // called, but couldn't figure out how to create an anlytics instance with the plugin
      // and then trigger the full flow trhough analytics.group() with only an anonymous ID
      // expect(destination.actions.group.perform).not.toHaveBeenCalled()

      expect(getBucketCallLog()).toStrictEqual([{ method: 'init', args: ['testTrackingKey', {}] }])
    })
  })
})
