import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '..'
import { rtidIntegrationFieldName, rtidQuerystringName, storageRTIDKey } from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'roktPlugin',
    name: 'Rokt Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let roktPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  roktPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  Object.defineProperty(window, 'location', {
    value: {
      search: ''
    },
    writable: true
  })

  window.localStorage.removeItem(storageRTIDKey)
})

describe('ajs-integration', () => {
  test('updates the original event with a Rokt rtid from the querystring', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: `?${rtidQuerystringName}=dummyQuerystringValue`
      },
      writable: true
    })

    await roktPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await roktPlugin.track?.(ctx)

    const roktIntegrationsObj = updatedCtx?.event?.integrations['Rokt Conversions API']
    expect(roktIntegrationsObj[rtidIntegrationFieldName]).toEqual('dummyQuerystringValue')
  })

  test('updates the original event with a Rokt rtid from storage', async () => {
    window.localStorage.setItem(storageRTIDKey, 'dummyStorageValue')

    await roktPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await roktPlugin.track?.(ctx)

    const roktIntegrationsObj = updatedCtx?.event?.integrations['Rokt Conversions API']
    expect(roktIntegrationsObj[rtidIntegrationFieldName]).toEqual('dummyStorageValue')
  })
})
