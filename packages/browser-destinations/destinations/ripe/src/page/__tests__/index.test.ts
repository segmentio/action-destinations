import type { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import RipeDestination, { destination } from '../../index'
import { RipeSDK } from '../../types'

import { loadScript } from '@segment/browser-destination-runtime/load-script'

jest.mock('@segment/browser-destination-runtime/load-script')
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
      messageId: {
        '@path': '$.messageId'
      },
      anonymousId: {
        '@path': '$.anonymousId'
      },
      userId: {
        '@path': '$.userId'
      },
      groupId: {
        '@path': '$.groupId'
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
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
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
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          anonymousId: 'anonymousId',
          userId: undefined,
          groupId: undefined,
          category: 'main',
          name: 'page2',
          properties: {
            previous: 'page1'
          }
        }
      })
    )

    expect(window.Ripe.page).toHaveBeenCalledWith({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      userId: undefined,
      groupId: undefined,
      anonymousId: 'anonymousId',
      category: 'main',
      name: 'page2',
      properties: expect.objectContaining({ previous: 'page1' })
    })
  })
})
