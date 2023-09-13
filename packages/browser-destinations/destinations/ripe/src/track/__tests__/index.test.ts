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
    partnerAction: 'track',
    name: 'Track user',
    enabled: true,
    subscribe: 'type = "track"',
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
      event: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Ripe.track', () => {
  test('it maps the event name and properties and passes them into RipeSDK.track', async () => {
    window.Ripe = {
      init: jest.fn().mockResolvedValueOnce('123'),
      setIds: jest.fn().mockResolvedValueOnce(undefined),
      track: jest.fn().mockResolvedValueOnce(undefined)
    } as unknown as RipeSDK

    const [event] = await RipeDestination({
      subscriptions,
      apiKey: '123'
    })

    const ajs = new Analytics({ writeKey: '123' })
    await event.load(Context.system(), ajs)
    jest.spyOn(destination.actions.track, 'perform')

    await event.track?.(
      new Context({
        messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
        type: 'track',
        anonymousId: 'anonymousId',
        event: 'Form Submitted',
        properties: {
          is_new_lead: true
        }
      })
    )

    expect(destination.actions.track.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
          anonymousId: 'anonymousId',
          userId: undefined,
          groupId: undefined,
          event: 'Form Submitted',
          properties: {
            is_new_lead: true
          }
        }
      })
    )

    expect(window.Ripe.track).toHaveBeenCalledWith({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      anonymousId: 'anonymousId',
      userId: undefined,
      groupId: undefined,
      event: 'Form Submitted',
      properties: expect.objectContaining({ is_new_lead: true })
    })
  })
})
