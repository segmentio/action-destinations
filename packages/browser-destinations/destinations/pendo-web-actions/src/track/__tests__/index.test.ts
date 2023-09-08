import { Analytics, Context } from '@segment/analytics-next'
import PendoDestination, { destination } from '../../index'
import { PendoSDK } from '../../types'

describe('Pendo.trackEvent', () => {
  window.pendo = {
    initialize: jest.fn().mockResolvedValueOnce({}),
    isReady: jest.fn().mockResolvedValueOnce(undefined),
    track: jest.fn().mockResolvedValueOnce(undefined),
    identify: jest.fn().mockResolvedValueOnce(undefined)
  } as unknown as PendoSDK

  it('Sends events to Pendo', async () => {
    const [event] = await PendoDestination({
      apiKey: 'abc123',
      setVisitorIdOnLoad: 'disabled',
      region: 'io',
      subscriptions: [
        {
          partnerAction: 'track',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            event: {
              '@path': '$.event'
            },
            metadata: {
              '@path': '$.properties'
            }
          }
        }
      ]
    })

    destination.actions.track.perform = jest.fn()
    const trackSpy = jest.spyOn(destination.actions.track, 'perform')
    await event.load(Context.system(), {} as Analytics)

    await event.track?.(
      new Context({
        type: 'track',
        event: 'Test Event',
        properties: {
          test: 'hello'
        }
      })
    )

    expect(trackSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          event: 'Test Event',
          metadata: {
            test: 'hello'
          }
        }
      })
    )
  })
})
