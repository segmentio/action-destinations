import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination, { destination } from '../index'

describe('trackEvent', () => {
  test('invokes braze`s logCustomEvent API', async () => {
    const [trackEvent] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.5',
      doNotLoadFontAwesome: true,
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Log Custom Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            eventName: {
              '@path': '$.event'
            },
            eventProperties: {
              '@path': '$.properties'
            }
          }
        }
      ]
    })

    destination.actions.trackEvent.perform = jest.fn()
    jest.spyOn(destination.actions.trackEvent, 'perform')
    jest.spyOn(destination, 'initialize')

    await trackEvent.load(Context.system(), {} as Analytics)
    await trackEvent.track?.(
      new Context({
        type: 'track',
        event: 'UFC',
        properties: {
          goat: 'hasbulla'
        }
      })
    )

    expect(destination.actions.trackEvent.perform).toHaveBeenCalledWith(
      expect.objectContaining({
        logCustomEvent: expect.any(Function)
      }),

      expect.objectContaining({
        payload: { eventName: 'UFC', eventProperties: { goat: 'hasbulla' } }
      })
    )
  })
})
