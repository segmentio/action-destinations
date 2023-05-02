import type { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import RipeDestination, { destination } from '../../index'

import { loadScript } from '@segment/browser-destination-runtime/load-script'
import { RipeSDK } from '../../types'

jest.mock('@segment/browser-destination-runtime/load-script')
beforeEach(async () => {
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

const subscriptions: Subscription[] = [
  {
    partnerAction: 'group',
    name: 'Group user',
    enabled: true,
    subscribe: 'type = "group"',
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

describe('Ripe.group', () => {
  test('it maps the event name and properties and passes them into RipeSDK.track', async () => {
    window.Ripe = {
      init: jest.fn().mockResolvedValueOnce('123'),
      group: jest.fn().mockResolvedValueOnce(undefined),
      setIds: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as RipeSDK

    const [event] = await RipeDestination({
      subscriptions,
      apiKey: '123'
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.group, 'perform')

    await event.group?.(
      new Context({
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        anonymousId: 'anonId1',
        type: 'group',
        groupId: 'groupId1',
        traits: {
          is_new_group: true
        }
      })
    )

    expect(destination.actions.group.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          anonymousId: 'anonId1',
          userId: undefined,
          groupId: 'groupId1',
          traits: {
            is_new_group: true
          }
        }
      })
    )

    expect(window.Ripe.group).toHaveBeenCalledWith({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      anonymousId: 'anonId1',
      userId: undefined,
      groupId: 'groupId1',
      traits: expect.objectContaining({ is_new_group: true })
    })
  })
})
