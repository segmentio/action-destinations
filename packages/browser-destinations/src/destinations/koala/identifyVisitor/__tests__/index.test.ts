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
      track: jest.fn().mockResolvedValueOnce(undefined),
      identify: jest.fn().mockResolvedValueOnce(undefined)
    }

    const [event] = await KoalaDestination({
      subscriptions,
      project_slug: 'koala-test'
    })

    await event.load(Context.system(), {} as Analytics)
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
