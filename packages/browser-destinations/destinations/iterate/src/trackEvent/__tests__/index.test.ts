import { Analytics, Context } from '@segment/analytics-next'
import iterateDestination, { destination } from '../../index'

describe('Iterate.trackEvent', () => {
  it('Sends events to Iterate', async () => {
    const [trackEvent] = await iterateDestination({
      apiKey: 'abc123',
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            name: {
              '@path': '$.name'
            }
          }
        }
      ]
    })

    destination.actions.trackEvent.perform = jest.fn()
    const trackSpy = jest.spyOn(destination.actions.trackEvent, 'perform')
    await trackEvent.load(Context.system(), {} as Analytics)

    await trackEvent.track?.(
      new Context({
        type: 'track',
        name: 'example-event'
      })
    )

    expect(trackSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          name: 'example-event'
        }
      })
    )
  })
})
