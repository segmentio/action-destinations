import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import brazeDestination, { destination } from '../index'
import { DESTINATION_API_VERSION, DESTINATION_CANARY_API_VERSION } from '../versioning-info'

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

  test('passes devicePropertyAllowlist to Braze SDK initialization', async () => {
    const devicePropertyAllowlist = ['os', 'browser']
    const [event] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: '3.5',
      doNotLoadFontAwesome: true,
      devicePropertyAllowlist,
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            eventName: { '@path': '$.event' },
            eventProperties: { '@path': '$.properties' }
          }
        }
      ]
    })

    const initializeSpy = jest.spyOn(destination, 'initialize')
    await event.load(Context.system(), {} as Analytics)

    // Check that the config passed to initialize contains the allowlist
    const callArgs = initializeSpy.mock.calls[0][0]?.settings || {}
    expect(callArgs.devicePropertyAllowlist).toEqual(devicePropertyAllowlist)
  })

  test('uses stable SDK version by default (6.1)', async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      // sdkVersion not specified - should use default
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            eventName: { '@path': '$.event' },
            eventProperties: { '@path': '$.properties' }
          }
        }
      ]
    })

    await event.load(Context.system(), {} as Analytics)

    const scripts = window.document.querySelectorAll('script')
    const brazeScript = Array.from(scripts).find((script) => script.src.includes('js.appboycdn.com/web-sdk'))

    expect(brazeScript?.src).toBe(`https://js.appboycdn.com/web-sdk/${DESTINATION_API_VERSION}/braze.no-module.min.js`)
  })

  test('can load canary SDK version (6.5) when explicitly selected', async () => {
    const [event] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'endpoint',
      sdkVersion: DESTINATION_CANARY_API_VERSION, // Explicitly select 6.5
      subscriptions: [
        {
          partnerAction: 'trackEvent',
          name: 'Track Event',
          enabled: true,
          subscribe: 'type = "track"',
          mapping: {
            eventName: { '@path': '$.event' },
            eventProperties: { '@path': '$.properties' }
          }
        }
      ]
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const scripts = window.document.querySelectorAll('script')
    const brazeScript = Array.from(scripts).find((script) => script.src.includes('js.appboycdn.com/web-sdk'))

    expect(brazeScript?.src).toBe(
      `https://js.appboycdn.com/web-sdk/${DESTINATION_CANARY_API_VERSION}/braze.no-module.min.js`
    )
  })

  test('verifies SDK version 6.5 is available in settings choices', () => {
    const sdkVersionField = destination.settings.sdkVersion
    const choices = sdkVersionField?.choices || []
    const hasVersion65 = choices.some((choice) => choice.value === '6.5')

    expect(hasVersion65).toBe(true)
    expect(sdkVersionField?.default).toBe(DESTINATION_API_VERSION)
  })
})
