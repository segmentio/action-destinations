import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '..'

const example: Subscription[] = [
  {
    partnerAction: 'dubPlugin',
    name: 'Dub Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

const cookieName = 'dub_id'
const cookieTestValue = 'dummyCookieValue'
let browserActions: Plugin[]
let dubPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  dubPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  Object.defineProperty(window, 'location', {
    value: {
      search: ''
    },
    writable: true
  })

  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
})

describe('ajs-integration', () => {
  test('updates the original event with a Dub cookie value', async () => {
    document.cookie = `${cookieName}=${cookieTestValue}`

    await dubPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await dubPlugin.track?.(ctx)

    const dubIntegrationsObj = updatedCtx?.event?.integrations['Dub (Actions)']
    expect(dubIntegrationsObj[cookieName]).toEqual(cookieTestValue)
  })
})
