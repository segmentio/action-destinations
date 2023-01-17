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
    partnerAction: 'page',
    name: 'Page view',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
      },
      category: {
        '@path': '$.category'
      },
      name: {
        '@path': '$.name'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Ripe.page', () => {
  test('it maps pageview properties and passes them into RipeSDK.page', async () => {
    window.Ripe = {
      init: jest.fn().mockResolvedValueOnce('123'),
      page: jest.fn().mockResolvedValueOnce(undefined),
      setIds: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as RipeSDK

    const [event] = await RipeDestination({
      subscriptions,
      apiKey: '123'
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.page, 'perform')

    await event.page?.(
      new Context({
        anonymousId: 'anonymousId',
        type: 'page',
        category: 'main',
        name: 'page2',
        properties: {
          previous: 'page1'
        }
      })
    )

    expect(destination.actions.page.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          anonymousId: 'anonymousId',
          category: 'main',
          name: 'page2',
          properties: {
            previous: 'page1'
          }
        }
      })
    )

    expect(window.Ripe.page).toHaveBeenCalledWith('main', 'page2', expect.objectContaining({ previous: 'page1' }))
    expect(window.Ripe.setIds).toHaveBeenCalledWith('anonymousId', undefined, undefined)
  })
})
