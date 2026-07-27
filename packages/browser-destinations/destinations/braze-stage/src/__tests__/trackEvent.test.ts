import { Analytics, Context } from '@segment/analytics-next'
import brazeDestination, { destination } from '../index'
const testSdkVersions = ['3.5', '4.1']

testSdkVersions.forEach((sdkVersion) => {
  describe(`trackEvent (v${sdkVersion})`, () => {
    test('invokes braze`s logCustomEvent API', async () => {
      const [trackEvent] = await brazeDestination({
        api_key: 'b_123',
        endpoint: 'endpoint',
        sdkVersion,
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

      jest.spyOn(destination.actions.trackEvent, 'perform')
      const initializeSpy = jest.spyOn(destination, 'initialize')

      await trackEvent.load(Context.system(), new Analytics({ writeKey: '123' }))

      // Spy on the braze APIs now that braze has been loaded.
      const { instance: braze } = await initializeSpy.mock.results[0].value
      const logCustomEventSpy = jest.spyOn(braze, 'logCustomEvent')

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
          instance: expect.objectContaining({
            logCustomEvent: expect.any(Function)
          })
        }),

        expect.objectContaining({
          payload: { eventName: 'UFC', eventProperties: { goat: 'hasbulla' } }
        })
      )

      expect(logCustomEventSpy).toHaveBeenCalledWith('UFC', { goat: 'hasbulla' })
    })
  })
})
