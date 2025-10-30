import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../'
import { clickIdIntegrationFieldName, clickIdQuerystringName, scidCookieName, scidIntegrationFieldName } from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'snapPlugin',
    name: 'Snap Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let snapPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  snapPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  Object.defineProperty(window, 'location', {
    value: {
      search: ''
    },
    writable: true
  })

  document.cookie = `${scidCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
})

describe('ajs-integration', () => {
  test('updates the original event with a Snap clientId from the querystring', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: `?${clickIdQuerystringName}=dummyQuerystringValue`
      },
      writable: true
    })

    await snapPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await snapPlugin.track?.(ctx)

    const snapIntegrationsObj = updatedCtx?.event?.integrations['Snap Conversions Api']
    expect(snapIntegrationsObj[clickIdIntegrationFieldName]).toEqual('dummyQuerystringValue')
  })

  test('updates the original event with a Snap cookie value', async () => {
    document.cookie = `${scidCookieName}=dummyCookieValue`

    await snapPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await snapPlugin.track?.(ctx)

    const snapIntegrationsObj = updatedCtx?.event?.integrations['Snap Conversions Api']
    expect(snapIntegrationsObj[scidIntegrationFieldName]).toEqual('dummyCookieValue')
  })
})
