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
    partnerAction: 'alias',
    name: 'Alias user',
    enabled: true,
    subscribe: 'type = "alias"',
    mapping: {
      userId: {
        '@path': '$.userId'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      }
    }
  }
]

describe('Ripe.alias', () => {
  test('it maps userId and passes it into RipeSDK.alias', async () => {
    window.Ripe = {
      init: jest.fn().mockResolvedValueOnce('123'),
      alias: jest.fn().mockResolvedValueOnce(undefined),
      setIds: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as RipeSDK

    const [event] = await RipeDestination({
      subscriptions,
      apiKey: '123'
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.alias, 'perform')

    await event.alias?.(
      new Context({
        type: 'alias',
        userId: 'newId'
      })
    )

    expect(destination.actions.alias.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          userId: 'newId'
        }
      })
    )

    expect(window.Ripe.alias).toHaveBeenCalledWith('newId')
  })

  test('it maps anonymousId if userId is not set and passes it into RipeSDK.alias', async () => {
    window.Ripe = {
      init: jest.fn().mockResolvedValueOnce('123'),
      alias: jest.fn().mockResolvedValueOnce(undefined),
      setIds: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as RipeSDK

    const [event] = await RipeDestination({
      subscriptions,
      apiKey: '123'
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.alias, 'perform')

    await event.alias?.(
      new Context({
        type: 'alias',
        anonymousId: 'anonymousId'
      })
    )

    expect(destination.actions.alias.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymousId'
        }
      })
    )

    expect(window.Ripe.alias).toHaveBeenCalledWith('anonymousId')
  })
})
