import { Analytics, Context } from '@segment/analytics-next'
import trackEventObject from '../index'
import wisepopsDestination from '../../index'
import { Subscription } from '@segment/browser-destination-runtime/types'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  // Prevent Wisepops SDK from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Wisepops.trackEvent', () => {
  const subscriptions: Subscription[] = [
    {
      partnerAction: 'trackEvent',
      name: trackEventObject.title,
      enabled: true,
      subscribe: 'type = "track"',
      mapping: {
        eventName: {
          '@path': '$.event'
        }
      }
    }
  ]

  test('custom event', async () => {
    const [trackEvent] = await wisepopsDestination({
      websiteId: '1234567890',
      subscriptions
    })

    expect(trackEvent).toBeDefined()

    await trackEvent.load(Context.system(), {} as Analytics)
    jest.spyOn(window.wisepops.q as any, 'push')

    const context = new Context({
      type: 'track',
      event: 'Something happens',
      properties: {
        eventParam: 'An event parameter'
      }
    })
    trackEvent.track?.(context)

    expect(window.wisepops.q.push).toHaveBeenCalledWith(['event', 'Something happens'])
  })
})
