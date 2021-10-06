import { Analytics, Context, Plugin } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import browserPluginsDestination from '../..'
import { Subscription } from '../../../../lib/browser-destinations'
import { friendbuyLocalStorageKey } from '../index'
import { get } from 'lodash'

const example: Subscription[] = [
  {
    partnerAction: 'profile',
    name: 'profile',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let profilePlugin: Plugin
let ajs: Analytics

const profile = 'JWT'
const friendbuyLocalStorage = JSON.stringify({ tracker: JSON.stringify({ tracker: profile }) })

beforeEach(async () => {
  jest.restoreAllMocks()
  jest.resetAllMocks()

  const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

  const jsd = new jsdom.JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://localhost'
  })

  const windowSpy = jest.spyOn(window, 'window', 'get')
  windowSpy.mockImplementation(() => jsd.window as unknown as Window & typeof globalThis)

  browserActions = await browserPluginsDestination({ subscriptions: example })
  profilePlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })
})

describe('ajs-integration', () => {
  test('runs as an enrichment middleware', async () => {
    await ajs.register(profilePlugin)
    jest.spyOn(profilePlugin, 'track')

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    await ajs.track(ctx.event)

    expect(profilePlugin.track).toHaveBeenCalled()
    expect(ajs.queue.plugins).toEqual([
      expect.objectContaining({
        name: 'Friendbuy Plugins profile',
        type: 'enrichment'
      })
    ])
  })
})

describe('profile', () => {
  beforeEach(async () => {
    await profilePlugin.load(Context.system(), ajs)
  })

  test('no profile in local storage', async () => {
    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    const updatedCtx = await profilePlugin.track?.(ctx)
    expect(get(updatedCtx, ['event', 'integrations', 'Actions Friendbuy'])).toBeUndefined()
  })

  test('existing profile in local storage', async () => {
    window.localStorage.setItem(friendbuyLocalStorageKey, friendbuyLocalStorage)

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    const updatedCtx = await profilePlugin.track?.(ctx)
    expect(get(updatedCtx, ['event', 'integrations', 'Actions Friendbuy', 'profile'])).toBe(profile)
  })
})
