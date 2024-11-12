import { Analytics, Context, User } from '@segment/analytics-next'
import bucketWebDestination, { destination } from '../index'
import { Subscription } from '@segment/browser-destination-runtime/types'
import { JSONArray } from '@segment/actions-core/*'
import { bucketTestHooks, getBucketCallLog } from '../test-utils'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.name'
      }
    }
  }
]

describe('Bucket', () => {
  bucketTestHooks()

  it('loads the Bucket SDK', async () => {
    const [instance] = await bucketWebDestination({
      trackingKey: 'testTrackingKey',
      subscriptions: subscriptions as unknown as JSONArray
    })

    jest.spyOn(destination, 'initialize')

    const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })

    await instance.load(Context.system(), analyticsInstance)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = Array.from(window.document.querySelectorAll('script'))
    expect(scripts).toMatchInlineSnapshot(`
      Array [
        <script
          src="https://cdn.jsdelivr.net/npm/@bucketco/tracking-sdk@2"
          status="loaded"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)

    expect(window.bucket).toMatchObject({
      init: expect.any(Function),
      user: expect.any(Function),
      company: expect.any(Function),
      track: expect.any(Function),
      reset: expect.any(Function)
    })
  })

  it('resets the Bucket SDK', async () => {
    const [instance] = await bucketWebDestination({
      trackingKey: 'testTrackingKey',
      subscriptions: subscriptions as unknown as JSONArray
    })

    const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })

    await instance.load(Context.system(), analyticsInstance)

    analyticsInstance.reset()

    expect(getBucketCallLog()).toStrictEqual([
      { method: 'init', args: ['testTrackingKey', {}] },
      { method: 'reset', args: [] }
    ])
  })

  it('passes options to bucket.init()', async () => {
    const [instance] = await bucketWebDestination({
      trackingKey: 'testTrackingKey',
      host: 'http://localhost:3200',
      subscriptions: subscriptions as unknown as JSONArray
    })

    const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })

    await instance.load(Context.system(), analyticsInstance)

    expect(getBucketCallLog()).toStrictEqual([
      { method: 'init', args: ['testTrackingKey', { host: 'http://localhost:3200' }] }
    ])
  })

  it('allows sdkVersion override', async () => {
    const [instance] = await bucketWebDestination({
      trackingKey: 'testTrackingKey',
      sdkVersion: 'latest',
      subscriptions: subscriptions as unknown as JSONArray
    })

    const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })

    await instance.load(Context.system(), analyticsInstance)

    const scripts = Array.from(window.document.querySelectorAll('script'))
    expect(scripts).toMatchInlineSnapshot(`
      Array [
        <script
          src="https://cdn.jsdelivr.net/npm/@bucketco/tracking-sdk@latest"
          status="loaded"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)

    expect(getBucketCallLog()).toStrictEqual([{ method: 'init', args: ['testTrackingKey', {}] }])
  })

  describe('when not logged in', () => {
    it('initializes Bucket SDK', async () => {
      const [instance] = await bucketWebDestination({
        trackingKey: 'testTrackingKey',
        subscriptions: subscriptions as unknown as JSONArray
      })

      const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })

      await instance.load(Context.system(), analyticsInstance)

      expect(getBucketCallLog()).toStrictEqual([{ method: 'init', args: ['testTrackingKey', {}] }])
    })
  })

  describe('when logged in', () => {
    it('initializes Bucket SDK and registers user', async () => {
      const [instance] = await bucketWebDestination({
        trackingKey: 'testTrackingKey',
        subscriptions: subscriptions as unknown as JSONArray
      })

      const analyticsInstance = new Analytics({ writeKey: 'test-writekey' })
      jest.spyOn(analyticsInstance, 'user').mockImplementation(
        () =>
          ({
            id: () => 'test-user-id-1'
          } as User)
      )

      await instance.load(Context.system(), analyticsInstance)

      expect(getBucketCallLog()).toStrictEqual([
        { method: 'init', args: ['testTrackingKey', {}] },
        { method: 'user', args: ['test-user-id-1', {}, { active: false }] }
      ])
    })
  })
})
