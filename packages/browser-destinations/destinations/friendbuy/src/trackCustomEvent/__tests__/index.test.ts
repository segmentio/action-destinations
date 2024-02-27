import { Analytics, Context } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackCustomEventObject, { browserTrackCustomEventFields } from '../index'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  // Prevent friendbuy.js and campaigns.js from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Friendbuy.trackCustomEvent', () => {
  const subscriptions = [
    {
      partnerAction: 'trackCustomEvent',
      name: trackCustomEventObject.title,
      enabled: true,
      subscribe: 'type = "track" and event = "download"',
      mapping: Object.fromEntries(
        Object.entries(browserTrackCustomEventFields).map(([name, value]) => [name, value.default])
      )
    }
  ]

  test('all fields', async () => {
    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'

    const [trackCustomEvent] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    // console.log('trackCustomEvent', JSON.stringify(trackCustomEvent, null, 2), trackCustomEvent)
    expect(trackCustomEvent).toBeDefined()

    await trackCustomEvent.load(Context.system(), {} as Analytics)

    // console.log(window.friendbuyAPI)
    jest.spyOn(window.friendbuyAPI as any, 'push')

    {
      // Non-download events are not sent.
      const context1 = new Context({
        type: 'track',
        event: 'upload',
        properties: { type: 'application', fileId: 'MyApp', deduplicationId: '1234' }
      })

      trackCustomEvent.track?.(context1)

      expect(window.friendbuyAPI?.push).not.toHaveBeenCalled()
    }

    {
      // Download events are sent.
      const context2 = new Context({
        type: 'track',
        event: 'download',
        properties: { type: 'application', fileId: 'MyApp', deduplicationId: '1234' }
      })

      trackCustomEvent.track?.(context2)

      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(1, [
        'track',
        'download',
        { type: 'application', fileId: 'MyApp', deduplicationId: '1234' }
      ])
    }

    {
      // Customer is sent if customer fields are present.
      const userId = 'john-doe-1234'
      const anonymousId = '960efa33-6d3b-4eb9-a4e7-d95412d9829e'
      const email = 'john.doe@example.com'
      const firstName = 'John'
      const lastName = 'Doe'
      const context3 = new Context({
        type: 'track',
        event: 'download',
        userId,
        anonymousId,
        properties: { type: 'application', fileId: 'MyApp', email, firstName, lastName }
      })

      trackCustomEvent.track?.(context3)

      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(2, [
        'track',
        'download',
        {
          type: 'application',
          fileId: 'MyApp',
          customer: { id: userId, anonymousId, email, firstName, lastName, name: `${firstName} ${lastName}` }
        }
      ])
    }
  })
})
