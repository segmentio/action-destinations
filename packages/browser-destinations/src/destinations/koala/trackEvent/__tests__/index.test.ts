import type { Subscription } from '../../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import KoalaDestination, { destination } from '../../index'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackEvent',
    name: 'Track Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Koala.trackEvent', () => {
  test('it maps the event name and properties and passes them into ko.track', async () => {
    window.ko = {
      track: jest.fn().mockResolvedValueOnce(undefined),
      identify: jest.fn().mockResolvedValueOnce(undefined)
    }

    const [event] = await KoalaDestination({
      subscriptions,
      project_slug: 'koala-test'
    })

    await event.load(Context.system(), {} as Analytics)
    jest.spyOn(destination.actions.trackEvent, 'perform')

    await event.track?.(
      new Context({
        type: 'track',
        event: 'Form Submitted',
        properties: {
          is_new_subscriber: true
        }
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          event: 'Form Submitted',
          properties: {
            is_new_subscriber: true
          }
        }
      })
    )
    expect(window.ko.track).toHaveBeenCalledWith(
      'Form Submitted',
      expect.objectContaining({
        is_new_subscriber: true
      })
    )
  })
})
