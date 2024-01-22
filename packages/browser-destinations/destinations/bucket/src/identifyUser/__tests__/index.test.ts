import { Analytics, Context } from '@segment/analytics-next'
import bucketWebDestination, { destination } from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core/*'
import { bucketTestHooks, getBucketCallLog } from '../../test-utils'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyUser',
    name: 'Identify User',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      userId: {
        '@path': '$.userId'
      },
      traits: {
        '@path': '$.traits'
      }
    }
  }
]

describe('Bucket.user', () => {
  bucketTestHooks()

  test('it maps event parameters correctly to bucket.user', async () => {
    const [identifyEvent] = await bucketWebDestination({
      trackingKey: 'testTrackingKey',
      subscriptions: subscriptions as unknown as JSONArray
    })

    await identifyEvent.load(Context.system(), new Analytics({ writeKey: 'test-writekey' }))

    jest.spyOn(destination.actions.identifyUser, 'perform')

    await identifyEvent.identify?.(
      new Context({
        type: 'identify',
        userId: 'user-id-1',
        traits: {
          name: 'John Doe',
          email: 'test-email-2@gmail.com',
          age: 42
        }
      })
    )

    expect(destination.actions.identifyUser.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: 'user-id-1',
          traits: {
            name: 'John Doe',
            email: 'test-email-2@gmail.com',
            age: 42
          }
        }
      })
    )

    expect(getBucketCallLog()).toStrictEqual([
      { method: 'init', args: ['testTrackingKey', {}] },
      {
        method: 'user',
        args: [
          'user-id-1',
          {
            name: 'John Doe',
            email: 'test-email-2@gmail.com',
            age: 42
          }
        ]
      }
    ])
  })
})
