import { Analytics } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import brazeDestination, { destination } from '../index'

// "Only Track Known Users" (deferUntilIdentified). These run against the real Braze SDK and record
// the order of the calls that decide which user a session belongs to.
describe('Only Track Known Users', () => {
  let calls: string[]

  // Records initialize / changeUser / openSession as the SDK global is assigned by its loader.
  function recordBrazeCalls() {
    let real: any
    Object.defineProperty(window, 'appboy', {
      configurable: true,
      get: () => real,
      set(sdk) {
        real = sdk
        for (const name of ['initialize', 'changeUser', 'openSession']) {
          const original = sdk[name]
          if (typeof original !== 'function') continue
          sdk[name] = (...args: unknown[]) => {
            calls.push(name === 'changeUser' ? `changeUser(${args.join(',')})` : name)
            return original.apply(sdk, args)
          }
        }
      }
    })
  }

  async function load(deferUntilIdentified = true, externalIdPath = '$.userId', extraSettings = {}) {
    const [updateUserProfile, trackEvent] = await brazeDestination({
      api_key: 'b_123',
      endpoint: 'sdk.iad-01.braze.com',
      sdkVersion: '3.5',
      doNotLoadFontAwesome: true,
      deferUntilIdentified,
      ...extraSettings,
      subscriptions: destination.presets?.map((sub) =>
        sub.partnerAction === 'updateUserProfile'
          ? { ...sub, enabled: true, mapping: { ...sub.mapping, external_id: { '@path': externalIdPath } } }
          : { ...sub, enabled: true }
      ) as Subscription[]
    })
    const initializeSpy = jest.spyOn(destination, 'initialize')
    const analytics = new Analytics({ writeKey: '123' })
    await analytics.register(updateUserProfile, trackEvent)
    return { analytics, initializeSpy }
  }

  beforeEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim()
      if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    calls = []
    recordBrazeCalls()
  })

  test('a user Segment already knows is handed to Braze before the session opens', async () => {
    window.localStorage.setItem('ajs_user_id', '"saved-user"')

    await load()

    expect(calls).toEqual(['initialize', 'changeUser(saved-user)', 'openSession'])
  })

  test('a returning user keeps sending events without identifying again', async () => {
    window.localStorage.setItem('ajs_user_id', '"saved-user"')

    const { analytics, initializeSpy } = await load()
    const { instance: braze } = await initializeSpy.mock.results[0].value
    const logCustomEventSpy = jest.spyOn(braze, 'logCustomEvent')

    await analytics.track('Returning Event', { plan: 'pro' })

    expect(logCustomEventSpy).toHaveBeenCalledWith('Returning Event', { plan: 'pro' })
  })

  test('the first login opens its session for the user, not anonymously', async () => {
    const { analytics } = await load()
    expect(calls).toEqual([])

    await analytics.identify('new-user')

    expect(calls.slice(0, 3)).toEqual(['initialize', 'changeUser(new-user)', 'openSession'])
  })

  test('a user Braze already holds is left alone, even when it differs from the Segment id', async () => {
    // Braze identified "cust-9" earlier (an external_id mapped from a trait); Segment knows "saved-user".
    window.localStorage.setItem('ajs_user_id', '"saved-user"')
    const { analytics } = await load()
    await analytics.identify('saved-user', { customer_id: 'cust-9' })
    calls.length = 0
    window.appboy.changeUser('cust-9')
    calls.length = 0

    // A new page load: Braze state is in storage, Segment still has the same saved id.
    const { analytics: returning } = await load()
    expect(returning.user().id()).toBe('saved-user')
    expect(calls.filter((call) => call.startsWith('changeUser'))).toEqual([])
  })

  test('a first login opens its session for the mapped external_id, not the Segment user id', async () => {
    const { analytics } = await load(true, '$.traits.customer_id')

    await analytics.identify('segment-user', { customer_id: 'cust-9' })

    expect(calls.slice(0, 3)).toEqual(['initialize', 'changeUser(cust-9)', 'openSession'])
    expect(calls).not.toContain('changeUser(segment-user)')
  })

  test('with SDK Authentication on, no unsigned changeUser goes out before the session opens', async () => {
    window.localStorage.setItem('ajs_user_id', '"saved-user"')

    await load(true, '$.userId', { enableSdkAuthentication: true })

    expect(calls).toEqual(['initialize', 'openSession'])
  })

  test('an anonymous visitor stays dark', async () => {
    const { analytics } = await load()
    await analytics.track('Anonymous Event')

    expect(calls).toEqual([])
  })

  test('an empty saved id is not handed to Braze', async () => {
    window.localStorage.setItem('ajs_user_id', '""')

    await load()

    expect(calls.filter((call) => call.startsWith('changeUser'))).toEqual([])
  })

  test('with the setting off, Braze starts as before with no extra changeUser', async () => {
    window.localStorage.setItem('ajs_user_id', '"saved-user"')

    await load(false)

    expect(calls).toEqual(['initialize', 'openSession'])
  })
})
