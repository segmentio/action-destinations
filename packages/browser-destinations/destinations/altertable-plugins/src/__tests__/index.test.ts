import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import altertablePluginsDestination from '../'
import {
  integrationName,
  sessionExpirationTimeMs,
  storageDeviceIdKey,
  storageLastEventAtKey,
  storageSessionIdKey
} from '../constants'

const example: Subscription[] = [
  {
    partnerAction: 'altertablePlugin',
    name: 'Altertable Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let altertablePlugin: Plugin
let ajs: Analytics

const trackEvent = async (integrations?: Record<string, unknown>) => {
  const ctx = new Context({
    type: 'track',
    event: 'Test Event',
    properties: { greeting: 'Hello Altertable!' },
    ...(integrations ? { integrations } : {})
  })
  return altertablePlugin.track?.(ctx)
}

const integrationDataOf = (ctx: Context | undefined) =>
  ctx?.event?.integrations?.[integrationName] as Record<string, unknown> | undefined

const sessionIdOf = (ctx: Context | undefined) => integrationDataOf(ctx)?.session_id

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

beforeEach(async () => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-01-01T10:00:00.000Z'))
  window.localStorage.clear()
  document.cookie.split('; ').forEach((cookie) => {
    const name = cookie.split('=')[0]
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  })
  setViewport(1280, 720)

  const browserActions = await altertablePluginsDestination({ subscriptions: example })
  altertablePlugin = browserActions[0]
  ajs = new Analytics({ writeKey: 'w_123' })
  await altertablePlugin.load(Context.system(), ajs)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('Altertable Plugins', () => {
  test('starts a new session and adds its ID to the event', async () => {
    const updated = await trackEvent()

    const sessionId = sessionIdOf(updated)
    expect(sessionId).toMatch(/^session-/)
    expect(window.localStorage.getItem(storageSessionIdKey)).toContain(sessionId)
  })

  test('keeps the same session while events are less than 30 minutes apart', async () => {
    const first = sessionIdOf(await trackEvent())

    jest.advanceTimersByTime(20 * 60 * 1000)
    const second = sessionIdOf(await trackEvent())

    jest.advanceTimersByTime(20 * 60 * 1000)
    const third = sessionIdOf(await trackEvent())

    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  test('keeps the same session when events are exactly 30 minutes apart', async () => {
    const first = sessionIdOf(await trackEvent())

    jest.advanceTimersByTime(sessionExpirationTimeMs)
    const second = sessionIdOf(await trackEvent())

    expect(second).toBe(first)
  })

  test('starts a new session after more than 30 minutes without events', async () => {
    const first = sessionIdOf(await trackEvent())

    jest.advanceTimersByTime(sessionExpirationTimeMs + 1)
    const second = sessionIdOf(await trackEvent())

    expect(second).toMatch(/^session-/)
    expect(second).not.toBe(first)
  })

  test('starts a new session when the stored last event time is invalid', async () => {
    const first = sessionIdOf(await trackEvent())

    window.localStorage.setItem(storageLastEventAtKey, 'not-a-timestamp')
    const second = sessionIdOf(await trackEvent())

    expect(second).not.toBe(first)
  })

  test('adds a device ID that stays the same across sessions', async () => {
    const first = integrationDataOf(await trackEvent())

    jest.advanceTimersByTime(sessionExpirationTimeMs + 1)
    const second = integrationDataOf(await trackEvent())

    expect(first?.device_id).toMatch(/^device-/)
    expect(second?.device_id).toBe(first?.device_id)
    expect(second?.session_id).not.toBe(first?.session_id)
    expect(window.localStorage.getItem(storageDeviceIdKey)).toContain(first?.device_id)
  })

  test('adds the current viewport to the event', async () => {
    const first = integrationDataOf(await trackEvent())

    setViewport(390, 844)
    const second = integrationDataOf(await trackEvent())

    expect(first?.viewport).toBe('1280x720')
    expect(second?.viewport).toBe('390x844')
  })

  test('leaves out the viewport when the window has no size', async () => {
    setViewport(0, 0)
    const updated = integrationDataOf(await trackEvent())

    expect(updated).not.toHaveProperty('viewport')
  })

  test('merges with existing Altertable integration data', async () => {
    const updated = await trackEvent({ [integrationName]: { other: 'value' } })

    expect(integrationDataOf(updated)).toEqual({
      other: 'value',
      session_id: sessionIdOf(updated),
      device_id: expect.stringMatching(/^device-/),
      viewport: '1280x720'
    })
  })

  test('does not add the session ID when all integrations are disabled', async () => {
    const updated = await trackEvent({ All: false })

    expect(updated?.event?.integrations?.[integrationName]).toBeUndefined()
  })

  test('adds the session ID when all integrations are disabled but Altertable is enabled', async () => {
    const updated = await trackEvent({ All: false, [integrationName]: true })

    expect(sessionIdOf(updated)).toMatch(/^session-/)
  })
})
