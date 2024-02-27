import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import brazeDestination, { destination } from '../index'

describe('initialization', () => {
  const settings = {
    safariWebsitePushId: 'safari',
    allowCrawlerActivity: true,
    doNotLoadFontAwesome: true,
    enableLogging: false,
    localization: 'pt',
    minimumIntervalBetweenTriggerActionsInSeconds: 60,
    openInAppMessagesInNewTab: true,
    sessionTimeoutInSeconds: 60,
    requireExplicitInAppMessageDismissal: true,
    allowUserSuppliedJavascript: true,
    contentSecurityNonce: 'bar',
    endpoint: 'endpoint',
    sdkVersion: '3.5'
  }

  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  test('can load braze', async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      subscriptions: [
        {
          partnerAction: 'trackPurchase',
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
      ],
      ...settings
    })

    jest.spyOn(destination.actions.trackPurchase, 'perform')
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const ctx = await event.track?.(
      new Context({
        type: 'track',
        properties: {
          banana: '📞'
        }
      })
    )

    expect(destination.actions.trackPurchase.perform).toHaveBeenCalled()
    expect(ctx).not.toBeUndefined()

    const scripts = window.document.querySelectorAll('script')

    expect(scripts).toMatchSnapshot(`
      NodeList [
        <script
          src="https://js.appboycdn.com/web-sdk/3.5/appboy.no-amd.min.js"
          type="text/javascript"
        />,
        <script>
          // the emptiness
        </script>,
      ]
    `)
  })

  test('can defer braze initialization when deferUntilIdentified is on', async () => {
    const [updateUserProfile, trackEvent] = await brazeDestination({
      api_key: 'b_123',
      deferUntilIdentified: true,
      subscriptions: destination.presets?.map((sub) => ({ ...sub, enabled: true })) as Subscription[],
      ...settings
    })

    jest.spyOn(destination.actions.trackEvent, 'perform')
    const initializeSpy = jest.spyOn(destination, 'initialize')

    const analytics = new Analytics({ writeKey: '123' })

    await analytics.register(updateUserProfile, trackEvent)

    // Spy on the braze APIs now that braze has been loaded.
    const { instance: braze } = await initializeSpy.mock.results[0].value
    const openSessionSpy = jest.spyOn(braze, 'openSession')
    const logCustomEventSpy = jest.spyOn(braze, 'logCustomEvent')

    await analytics.track?.({
      type: 'track',
      event: 'UFC',
      properties: {
        goat: 'hasbulla'
      }
    })

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

    expect(analytics.user().id()).toBe(null)
    expect(openSessionSpy).not.toHaveBeenCalled()
    expect(logCustomEventSpy).not.toHaveBeenCalled()

    await analytics.identify('27413')

    await analytics.track?.({
      type: 'track',
      event: 'FIFA',
      properties: {
        goat: 'deno'
      }
    })

    expect(openSessionSpy).toHaveBeenCalled()
    expect(logCustomEventSpy).toHaveBeenCalledWith('FIFA', { goat: 'deno' })
  })
})
