import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import altertablePluginsDestination from '../../'
import { integrationName, sessionExpirationTimeMs, storageLastEventAtKey, storageSessionIdKey } from '../../constants'

const example: Subscription[] = [
  {
    partnerAction: 'sessionId',
    name: 'Session Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let sessionPlugin: Plugin
let ajs: Analytics

const trackEvent = async (integrations?: Record<string, unknown>) => {
  const ctx = new Context({
    type: 'track',
    event: 'Test Event',
    properties: { greeting: 'Hello Altertable!' },
    ...(integrations ? { integrations } : {})
  })
  return sessionPlugin.track?.(ctx)
}

const integrationDataOf = (ctx: Context | undefined) =>
  ctx?.event?.integrations?.[integrationName] as Record<string, unknown> | undefined

const sessionIdOf = (ctx: Context | undefined) => integrationDataOf(ctx)?.session_id

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

  const browserActions = await altertablePluginsDestination({ subscriptions: example })
  sessionPlugin = browserActions[0]
  ajs = new Analytics({ writeKey: 'w_123' })
  await sessionPlugin.load(Context.system(), ajs)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('Altertable Session Plugin', () => {
  test('starts a new session and adds its ID to the event', async () => {
    const updated = await trackEvent()

    const sessionId = sessionIdOf(updated)
    expect(sessionId).toMatch(/^session-/)
    expect(window.localStorage.getItem(storageSessionIdKey)).toContain(sessionId)
    expect(window.localStorage.getItem(storageLastEventAtKey)).toContain('2026-01-01T10:00:00.000Z')
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

  test('merges with existing Altertable integration data', async () => {
    const updated = await trackEvent({ [integrationName]: { other: 'value' } })

    expect(integrationDataOf(updated)).toEqual({
      other: 'value',
      session_id: sessionIdOf(updated)
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
