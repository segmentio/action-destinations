import type { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import KoalaDestination, { destination } from '../../index'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identifyVisitor',
    name: 'Identify Visitor',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      traits: {
        '@path': '$.traits'
      }
    }
  }
]

describe('Koala.identifyVisitor', () => {
  test('it maps traits and passes them into ko.identify', async () => {
    window.ko = {
      ready: jest.fn(),
      track: jest.fn().mockResolvedValueOnce(undefined),
      identify: jest.fn().mockResolvedValueOnce(undefined)
    }
    window.KoalaSDK = {
      load: jest.fn().mockResolvedValueOnce(window.ko)
    }

    const [event] = await KoalaDestination({
      subscriptions,
      project_slug: 'koala-test'
    })

    const ajs = new Analytics({ writeKey: 'w_123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.identifyVisitor, 'perform')

    await event.identify?.(
      new Context({
        type: 'identify',
        traits: {
          name: 'Matt'
        }
      })
    )

    expect(destination.actions.identifyVisitor.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          traits: {
            name: 'Matt'
          }
        }
      })
    )
    expect(window.ko.identify).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Matt'
      })
    )
  })
})
