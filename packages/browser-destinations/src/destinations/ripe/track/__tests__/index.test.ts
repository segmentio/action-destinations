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
    partnerAction: 'track',
    name: 'Track user',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      anonymousId: {
        '@path': '$.anonymousId'
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
          anonymousId: 'anonymousId',
          event: 'Form Submitted',
          properties: {
            is_new_lead: true
          }
        }
      })
    )

    expect(window.Ripe.track).toHaveBeenCalledWith('Form Submitted', expect.objectContaining({ is_new_lead: true }))
    expect(window.Ripe.setIds).toHaveBeenCalledWith('anonymousId', undefined, undefined)
  })
})
