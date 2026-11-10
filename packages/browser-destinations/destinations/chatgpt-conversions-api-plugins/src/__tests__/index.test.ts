import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../'
import {
  getCookieValue,
  getQuerystringValue,
  integrationName,
  obrefCookieName,
  obrefIntegrationFieldName,
  opprefIntegrationFieldName,
  opprefQuerystringName,
  storageFallback,
  storageOpprefKey
} from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'chatgptConversionsApiPlugin',
    name: 'ChatGPT Conversions API Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let chatgptConversionsApiPlugin: Plugin
let ajs: Analytics

const setSearch = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true
  })
}

const expireCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

const loadPlugin = async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  chatgptConversionsApiPlugin = browserActions[0]
  ajs = new Analytics({ writeKey: 'w_123' })
  await chatgptConversionsApiPlugin.load(Context.system(), ajs)
}

const trackEvent = async (integrations?: Record<string, unknown>) => {
  const ctx = new Context({
    type: 'track',
    event: 'Test Event',
    properties: { greeting: 'Yo!' },
    ...(integrations ? { integrations } : {})
  })
  return chatgptConversionsApiPlugin.track?.(ctx)
}

beforeEach(() => {
  window.localStorage.clear()
  ;[obrefCookieName, storageOpprefKey].forEach(expireCookie)
  setSearch('')
})

describe('querystring and cookie capture', () => {
  test('adds oppref from the querystring to the event', async () => {
    setSearch(`?${opprefQuerystringName}=opp_abc123`)
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({ [opprefIntegrationFieldName]: 'opp_abc123' })
  })

  test('adds obref from the __obref cookie to the event', async () => {
    document.cookie = `${obrefCookieName}=obr_cookie_value`
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      [obrefIntegrationFieldName]: 'obr_cookie_value'
    })
  })

  test('adds both values together', async () => {
    document.cookie = `${obrefCookieName}=obr_cookie_value`
    setSearch(`?utm_source=x&${opprefQuerystringName}=opp_abc123`)
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      [opprefIntegrationFieldName]: 'opp_abc123',
      [obrefIntegrationFieldName]: 'obr_cookie_value'
    })
  })

  test('picks up an __obref cookie set after the plugin loaded', async () => {
    await loadPlugin()
    document.cookie = `${obrefCookieName}=late_cookie_value`

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      [obrefIntegrationFieldName]: 'late_cookie_value'
    })
  })

  test('stops sending obref once the __obref cookie is gone', async () => {
    document.cookie = `${obrefCookieName}=obr_cookie_value`
    await loadPlugin()

    const first = await trackEvent()
    expireCookie(obrefCookieName)
    const second = await trackEvent()

    expect(first?.event?.integrations[integrationName]).toEqual({ [obrefIntegrationFieldName]: 'obr_cookie_value' })
    expect(second?.event?.integrations?.[integrationName]).toBeUndefined()
  })

  test('uses the current __obref cookie value when it changes', async () => {
    document.cookie = `${obrefCookieName}=old_value`
    await loadPlugin()
    document.cookie = `${obrefCookieName}=new_value`

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({ [obrefIntegrationFieldName]: 'new_value' })
  })

  test('keeps sending the stored oppref on later page loads without the querystring', async () => {
    setSearch(`?${opprefQuerystringName}=opp_abc123`)
    await loadPlugin()

    setSearch('')
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({ [opprefIntegrationFieldName]: 'opp_abc123' })
  })

  test('last click wins: a new oppref replaces the stored one', async () => {
    setSearch(`?${opprefQuerystringName}=first_click`)
    await loadPlugin()

    setSearch(`?${opprefQuerystringName}=second_click`)
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({ [opprefIntegrationFieldName]: 'second_click' })
  })

  test('sends oppref unchanged: percent-encoding is decoded and a plus sign is kept', async () => {
    setSearch(`?${opprefQuerystringName}=ab%2Fcd+ef%3D`)
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      [opprefIntegrationFieldName]: 'ab/cd+ef='
    })
  })

  test('leaves the event untouched when nothing was captured', async () => {
    await loadPlugin()

    const updatedCtx = await trackEvent()

    expect(updatedCtx?.event?.integrations?.[integrationName]).toBeUndefined()
  })
})

describe('existing integrations values', () => {
  beforeEach(async () => {
    document.cookie = `${obrefCookieName}=obr_cookie_value`
    setSearch(`?${opprefQuerystringName}=opp_abc123`)
    await loadPlugin()
  })

  test('does not overwrite an oppref or obref already on the event', async () => {
    const updatedCtx = await trackEvent({
      [integrationName]: { oppref: 'set_by_customer', obref: 'obr_by_customer' }
    })

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      oppref: 'set_by_customer',
      obref: 'obr_by_customer'
    })
  })

  test('fills in only the missing value and keeps other keys', async () => {
    const updatedCtx = await trackEvent({
      [integrationName]: { oppref: 'set_by_customer', other: 'kept' }
    })

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      oppref: 'set_by_customer',
      obref: 'obr_cookie_value',
      other: 'kept'
    })
  })

  test('skips the event when All is false and the destination is not enabled', async () => {
    const updatedCtx = await trackEvent({ All: false, Mixpanel: true })

    expect(updatedCtx?.event?.integrations[integrationName]).toBeUndefined()
  })

  test('enriches the event when All is false but the destination is enabled', async () => {
    const updatedCtx = await trackEvent({ All: false, [integrationName]: true })

    expect(updatedCtx?.event?.integrations[integrationName]).toEqual({
      oppref: 'opp_abc123',
      obref: 'obr_cookie_value'
    })
  })

  test('does not turn the destination on when the event has it disabled', async () => {
    const updatedCtx = await trackEvent({ [integrationName]: false })

    expect(updatedCtx?.event?.integrations[integrationName]).toBe(false)
  })
})

describe('utils', () => {
  test('getQuerystringValue returns null when the parameter is absent or empty', () => {
    expect(getQuerystringValue('', 'oppref')).toBeNull()
    expect(getQuerystringValue('?a=1', 'oppref')).toBeNull()
    expect(getQuerystringValue('?oppref=', 'oppref')).toBeNull()
    expect(getQuerystringValue('?oppref', 'oppref')).toBeNull()
  })

  test('getQuerystringValue does not match a parameter that only starts with the name', () => {
    expect(getQuerystringValue('?oppref_other=1&xoppref=2', 'oppref')).toBeNull()
  })

  test('getQuerystringValue keeps the raw value when it is not valid percent-encoding', () => {
    expect(getQuerystringValue('?oppref=100%', 'oppref')).toBe('100%')
  })

  test('getCookieValue reads a cookie and returns null when absent or empty', () => {
    document.cookie = 'other_cookie=1'
    document.cookie = `${obrefCookieName}=abc`
    expect(getCookieValue(obrefCookieName)).toBe('abc')

    expireCookie(obrefCookieName)
    expect(getCookieValue(obrefCookieName)).toBeNull()
  })

  test('storageFallback does not throw when localStorage is blocked', () => {
    const blocked = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    expect(storageFallback.get(storageOpprefKey)).toBeNull()
    expect(() => storageFallback.set(storageOpprefKey, 'abc')).not.toThrow()
    getItem.mockRestore()
    setItem.mockRestore()
  })

  test('getCookieValue does not decode the value', () => {
    document.cookie = `${obrefCookieName}=a%2Fb`
    expect(getCookieValue(obrefCookieName)).toBe('a%2Fb')
  })
})
