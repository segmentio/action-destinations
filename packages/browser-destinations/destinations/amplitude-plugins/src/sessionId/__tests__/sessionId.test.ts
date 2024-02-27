import { Analytics, Context, Plugin } from '@segment/analytics-next'
import browserPluginsDestination from '../..'
import { Subscription } from '@segment/browser-destination-runtime/types'
import jar from 'js-cookie'

expect.extend({
  toBeWithinOneSecondOf(got, expected) {
    if (typeof got === 'string') {
      got = parseInt(got, 10)
    }

    if (typeof expected === 'string') {
      expected = parseInt(expected, 10)
    }

    const oneSecond = 1000

    const timeDiff = Math.abs(expected - got)
    const timeDiffInSeconds = timeDiff / 1000

    const pass = timeDiff < oneSecond
    const message = () =>
      `${got} should be within a second of ${expected}, ` + `actual difference: ${timeDiffInSeconds.toFixed(1)}s`

    return { pass, message }
  }
})

const example: Subscription[] = [
  {
    partnerAction: 'sessionId',
    name: 'SessionId',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let sessionIdPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  sessionIdPlugin = browserActions[0]

  // clear storage and cookies
  document.cookie.split(';').forEach(function (c) {
    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
  })
  window.localStorage.clear()

  ajs = new Analytics({
    writeKey: 'w_123'
  })
})

describe('ajs-integration', () => {
  test('updates the original event with a session id', async () => {
    await sessionIdPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    const updatedCtx = await sessionIdPlugin.track?.(ctx)

    // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
    expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).not.toBeUndefined()
    // @ts-expect-error
    expect(typeof updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBe('number')
  })

  test('updates the original eveent when All: false but Actions Amplitude: true', async () => {
    await sessionIdPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      },
      integrations: {
        All: false,
        'Actions Amplitude': true
      }
    })

    const updatedCtx = await sessionIdPlugin.track?.(ctx)

    // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
    expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).not.toBeUndefined()
    // @ts-expect-error
    expect(typeof updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBe('number')
  })

  test('doesnt update the original event with a session id when All: false', async () => {
    await sessionIdPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      },
      integrations: {
        All: false
      }
    })

    const updatedCtx = await sessionIdPlugin.track?.(ctx)

    // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
    expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeUndefined()
  })

  test('runs as an enrichment middleware', async () => {
    await ajs.register(sessionIdPlugin)
    jest.spyOn(sessionIdPlugin, 'track')

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    await ajs.track(ctx.event)

    expect(sessionIdPlugin.track).toHaveBeenCalled()
    expect(ajs.queue.plugins.map((p) => ({ name: p.name, type: p.type }))).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "Amplitude (Actions) sessionId",
          "type": "enrichment",
        },
      ]
    `)
  })
})

describe('sessionId', () => {
  beforeEach(async () => {
    jest.useFakeTimers('legacy')
    await sessionIdPlugin.load(Context.system(), ajs)
  })

  const id = () => new Date().getTime()

  describe('new sessions', () => {
    test('sets a session id', async () => {
      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(id())
    })

    test('persists the session id', async () => {
      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      await sessionIdPlugin.track?.(ctx)

      // persists the session id in both cookies and local storage
      expect(window.localStorage.getItem('analytics_session_id')).toBeWithinOneSecondOf(id().toString())
      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(id().toString())
      expect(jar.get('analytics_session_id')).toBeWithinOneSecondOf(id().toString())
      expect(jar.get('analytics_session_id.last_access')).toBeWithinOneSecondOf(id().toString())
      expect(jar.get('analytics_session_id')).toBe(window.localStorage.getItem('analytics_session_id'))
      expect(jar.get('analytics_session_id.last_access')).toBe(window.localStorage.getItem('analytics_session_id'))
    })
  })

  describe('existing sessions', () => {
    test('uses an existing session id in LS', async () => {
      const then = id()
      jest.advanceTimersByTime(10000)

      window.localStorage.setItem('analytics_session_id', then.toString())

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(then)
    })

    test('sync session info from LS to cookies', async () => {
      const then = id()

      window.localStorage.setItem('analytics_session_id', then.toString())
      window.localStorage.setItem('analytics_session_id.last_access', then.toString())

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(then)
      expect(jar.get('analytics_session_id')).toBeWithinOneSecondOf(then)
    })

    test('uses an existing session id stored in cookies and sync it with local storage', async () => {
      const then = id()
      jest.advanceTimersByTime(10000)
      jar.set('analytics_session_id', then.toString())

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })
      const now = id()
      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(then)
      // synced to local storage
      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(now)
      expect(window.localStorage.getItem('analytics_session_id')).toBeWithinOneSecondOf(then)
    })

    test('keeps track of when the session was last accessed', async () => {
      const then = id()
      jest.advanceTimersByTime(10000)
      window.localStorage.setItem('analytics_session_id', then.toString())

      const now = id()

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(then)

      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(now)
      expect(jar.get('analytics_session_id.last_access')).toBeWithinOneSecondOf(now)
    })

    test('reset session when stale', async () => {
      const then = id()
      window.localStorage.setItem('analytics_session_id.last_access', then.toString())
      window.localStorage.setItem('analytics_session_id', then.toString())

      const THIRTY_MINUTES = 30 * 60000
      jest.advanceTimersByTime(THIRTY_MINUTES)

      const now = id()

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(now)

      expect(window.localStorage.getItem('analytics_session_id')).toBeWithinOneSecondOf(now.toString())
      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(now.toString())
      expect(jar.get('analytics_session_id')).toBeWithinOneSecondOf(now.toString())
      expect(jar.get('analytics_session_id.last_access')).toBeWithinOneSecondOf(now.toString())
    })
  })

  describe('work without AJS storage layer', () => {
    test('uses an existing session id in LS when AJS storage layer is not available', async () => {
      const then = id()
      //@ts-expect-error
      jest.spyOn(ajs, 'storage', 'get').mockReturnValue(undefined)
      jest.advanceTimersByTime(10000)

      window.localStorage.setItem('analytics_session_id', then.toString())

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(then)
      expect(jar.get('analytics_session_id')).toBe(undefined)
    })

    test('uses an existing session id in LS when AJS storage layer is not available', async () => {
      const then = id()
      //@ts-expect-error
      jest.spyOn(ajs, 'storage', 'get').mockReturnValue(undefined)

      window.localStorage.setItem('analytics_session_id.last_access', then.toString())
      window.localStorage.setItem('analytics_session_id', then.toString())

      const THIRTY_MINUTES = 30 * 60000
      jest.advanceTimersByTime(THIRTY_MINUTES)

      const now = id()

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await sessionIdPlugin.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations['Actions Amplitude']?.session_id).toBeWithinOneSecondOf(now)

      expect(window.localStorage.getItem('analytics_session_id')).toBeWithinOneSecondOf(now.toString())
      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(now.toString())
      expect(jar.get('analytics_session_id')).toBeUndefined()
      expect(jar.get('analytics_session_id.last_access')).toBeUndefined()
    })
  })
})
