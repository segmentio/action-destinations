import { Analytics, Context, JSONValue } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackCustomEventObject, { trackCustomEventFields } from '../index'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
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
      mapping: Object.fromEntries(Object.entries(trackCustomEventFields).map(([name, value]) => [name, value.default]))
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

    const trackTest = (event: string, properties: Record<string, JSONValue>, friendbuyPayload: unknown) => {
      ;(window.friendbuyAPI?.push as jest.Mock).mockReset()

      const context = new Context({
        type: 'track',
        event,
        properties
      })

      trackCustomEvent.track?.(context)

      if (friendbuyPayload) {
        expect(window.friendbuyAPI?.push).toHaveBeenCalledWith(['track', event, friendbuyPayload])
      } else {
        expect(window.friendbuyAPI?.push).not.toHaveBeenCalled()
      }
    }

    trackTest(
      'download',
      { type: 'application', name: 'MyApp', deduplicationId: '1234' },
      { type: 'application', name: 'MyApp', deduplicationId: '1234' }
    )

    trackTest('upload', { type: 'application', deduplicationId: '1234' }, undefined)
  })
})
