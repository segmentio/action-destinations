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

  test('does not initialize when a userId is only present in persisted storage (no identify this page load)', async () => {
    const [updateUserProfile, trackEvent] = await brazeDestination({
      api_key: 'b_123',
      deferUntilIdentified: true,
      subscriptions: destination.presets?.map((sub) => ({ ...sub, enabled: true })) as Subscription[],
      ...settings
    })

    const initializeSpy = jest.spyOn(destination, 'initialize')
    const analytics = new Analytics({ writeKey: '123' })

    await analytics.register(updateUserProfile, trackEvent)

    // Simulate a userId persisted from a prior session (ajs_user_id in localStorage).
    // This must NOT be enough to open a Braze session on its own.
    jest.spyOn(analytics.user(), 'id').mockReturnValue('stale-user-123')

    const { instance: braze } = await initializeSpy.mock.results[0].value
    const openSessionSpy = jest.spyOn(braze, 'openSession')
    const changeUserSpy = jest.spyOn(braze, 'changeUser')

    await analytics.track?.({
      type: 'track',
      event: 'UFC',
      properties: {
        goat: 'hasbulla'
      }
    })

    expect(analytics.user().id()).toBe('stale-user-123')
    expect(openSessionSpy).not.toHaveBeenCalled()
    expect(changeUserSpy).not.toHaveBeenCalled()
  })

  test('changes to the identified user before opening the session', async () => {
    const [updateUserProfile, trackEvent] = await brazeDestination({
      api_key: 'b_123',
      deferUntilIdentified: true,
      subscriptions: destination.presets?.map((sub) => ({ ...sub, enabled: true })) as Subscription[],
      ...settings
    })

    const initializeSpy = jest.spyOn(destination, 'initialize')
    const analytics = new Analytics({ writeKey: '123' })

    await analytics.register(updateUserProfile, trackEvent)

    const { instance: braze } = await initializeSpy.mock.results[0].value
    const openSessionSpy = jest.spyOn(braze, 'openSession')
    const changeUserSpy = jest.spyOn(braze, 'changeUser')

    await analytics.identify('user-42')

    expect(changeUserSpy).toHaveBeenCalledWith('user-42')
    expect(openSessionSpy).toHaveBeenCalled()
    // changeUser must run before openSession so the session is attributed to the
    // known user and Braze does not create a separate anonymous profile.
    expect(changeUserSpy.mock.invocationCallOrder[0]).toBeLessThan(openSessionSpy.mock.invocationCallOrder[0])
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
})
