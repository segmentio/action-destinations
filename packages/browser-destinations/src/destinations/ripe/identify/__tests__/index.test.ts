import type { Subscription } from '../../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import RipeDestination, { destination } from '../../index'
import { RipeSDK } from '../../types'

import { loadScript } from '../../../../runtime/load-script'

jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

const subscriptions: Subscription[] = [
  {
    partnerAction: 'identify',
    name: 'Identify user',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
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

describe('Ripe.identify', () => {
  test('it maps userId and traits and passes them into RipeSDK.identify', async () => {
    window.Ripe = {
      init: jest.fn().mockResolvedValueOnce('123'),
      identify: jest.fn().mockResolvedValueOnce(undefined),
      setIds: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as RipeSDK

    const [event] = await RipeDestination({
      subscriptions,
      apiKey: '123'
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.identify, 'perform')

    await event.identify?.(
      new Context({
        type: 'identify',
        anonymousId: 'anonymousId',
        userId: 'userId',
        traits: {
          name: 'Simon'
        }
      })
    )

    expect(destination.actions.identify.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymousId',
          userId: 'userId',
          traits: {
            name: 'Simon'
          }
        }
      })
    )

    expect(window.Ripe.identify).toHaveBeenCalledWith(
      expect.stringMatching('anonymousId'),
      expect.stringMatching('userId'),
      expect.objectContaining({ name: 'Simon' })
    )
  })
})
