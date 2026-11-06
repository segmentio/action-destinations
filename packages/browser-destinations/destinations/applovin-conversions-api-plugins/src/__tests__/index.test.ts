import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import applovinPluginsDestination from '../'
import {
  alartCookieName,
  aleidCookieName,
  axwrtCookieName,
  axwrtServerCookieName,
  getCookieValue,
  integrationName,
  storageAlartKey,
  storageAleidKey
} from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'applovinPlugin',
    name: 'AppLovin Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

const clearCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

const setLocationSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true
  })
}

let applovinPlugin: Plugin
let ajs: Analytics

const loadPlugin = async () => {
  const browserActions = await applovinPluginsDestination({ subscriptions: example })
  applovinPlugin = browserActions[0]
  ajs = new Analytics({ writeKey: 'w_123' })
  await applovinPlugin.load(Context.system(), ajs)
}

const trackEvent = async (integrations?: Record<string, unknown>) => {
  const ctx = new Context({
    type: 'track',
    event: 'Test Event',
    properties: { greeting: 'Hello AppLovin!' },
    ...(integrations ? { integrations } : {})
  })
  return applovinPlugin.track?.(ctx)
}

beforeEach(() => {
  setLocationSearch('')
  window.localStorage.clear()
  ;[
    aleidCookieName,
    alartCookieName,
    axwrtCookieName,
    axwrtServerCookieName,
    storageAleidKey,
    storageAlartKey
  ].forEach(clearCookie)
})

describe('AppLovin Conversions API Plugins', () => {
  test('adds aleid from the querystring to the event and stores it in a cookie', async () => {
    setLocationSearch('?aleid=click-1')
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ aleid: 'click-1' })
    expect(getCookieValue(aleidCookieName)).toBe('click-1')
  })

  test('adds alart from the querystring to the event and stores it in a cookie', async () => {
    setLocationSearch('?alart=token-1')
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ alart: 'token-1' })
    expect(getCookieValue(alartCookieName)).toBe('token-1')
  })

  test('uses the stored aleid on later pages without the querystring', async () => {
    window.localStorage.setItem(storageAleidKey, 'stored-click')
    window.localStorage.setItem(storageAlartKey, 'stored-token')
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ aleid: 'stored-click', alart: 'stored-token' })
  })

  test('falls back to the AppLovin Pixel cookies when nothing is stored', async () => {
    document.cookie = `${aleidCookieName}=pixel-click`
    document.cookie = `${alartCookieName}=pixel-token`
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ aleid: 'pixel-click', alart: 'pixel-token' })
  })

  test('a new ad click replaces the previously stored aleid', async () => {
    window.localStorage.setItem(storageAleidKey, 'old-click')
    document.cookie = `${aleidCookieName}=old-click`
    setLocationSearch('?aleid=new-click')
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ aleid: 'new-click' })
    expect(getCookieValue(aleidCookieName)).toBe('new-click')
  })

  test('adds the _axwrt cookie value to the event', async () => {
    document.cookie = `${axwrtCookieName}=wrt-1`
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ axwrt: 'wrt-1' })
  })

  test('falls back to the axwrt cookie when _axwrt is missing', async () => {
    document.cookie = `${axwrtServerCookieName}=wrt-server`
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ axwrt: 'wrt-server' })
  })

  test('does not modify the event when no AppLovin values are available', async () => {
    await loadPlugin()

    const updated = await trackEvent()

    expect(updated?.event?.integrations?.[integrationName]).toBeUndefined()
  })

  test('does not add values when all integrations are disabled', async () => {
    document.cookie = `${axwrtCookieName}=wrt-1`
    await loadPlugin()

    const updated = await trackEvent({ All: false })

    expect(updated?.event?.integrations?.[integrationName]).toBeUndefined()
  })

  test('adds values when AppLovin is explicitly enabled and All is false', async () => {
    document.cookie = `${axwrtCookieName}=wrt-1`
    await loadPlugin()

    const updated = await trackEvent({ All: false, [integrationName]: true })

    expect(updated?.event?.integrations?.[integrationName]).toEqual({ axwrt: 'wrt-1' })
  })
})
