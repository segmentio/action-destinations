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
    partnerAction: 'identify',
    name: 'Identify user',
    enabled: true,
    subscribe: 'type = "identify"',
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
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
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
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          anonymousId: 'anonymousId',
          userId: 'userId',
          groupId: undefined,
          traits: {
            name: 'Simon'
          }
        }
      })
    )

    expect(window.Ripe.identify).toHaveBeenCalledWith({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      userId: expect.stringMatching('userId'),
      anonymousId: 'anonymousId',
      groupId: undefined,
      traits: expect.objectContaining({ name: 'Simon' })
    })
  })
})
