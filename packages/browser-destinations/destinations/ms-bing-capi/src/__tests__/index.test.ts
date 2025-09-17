import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '..'
import { clickIdIntegrationFieldName, clickIdQuerystringName } from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'msclkidPlugin',
    name: 'Microsoft Bing msclkid Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let msclkidPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  msclkidPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  Object.defineProperty(window, 'location', {
    value: {
      search: ''
    },
    writable: true
  })
})

describe('ajs-integration', () => {
  test('updates the original event with a Microsoft Bing msclkid from the querystring', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: `?${clickIdQuerystringName}=dummyQuerystringValue`
      },
      writable: true
    })

    await msclkidPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await msclkidPlugin.track?.(ctx)

    const msBingCAPIIntegrationsObj = updatedCtx?.event?.integrations['Microsoft Bing CAPI']

    expect(msBingCAPIIntegrationsObj[clickIdIntegrationFieldName]).toEqual('dummyQuerystringValue')
  })
})