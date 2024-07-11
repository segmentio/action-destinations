import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../'

const example: Subscription[] = [
  {
    partnerAction: 'contentstackPlugin',
    name: 'Contentstack Browser Plugin',
    enabled: true,
    subscribe: 'type = "identify"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let contentstackPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  contentstackPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })

})

describe('ajs-integration', () => {
  test('updates the original event integrations object to indicate if attributes should be created', async () => {

    await contentstackPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'identify',
      traits: {
        trait1: 'hello'
      }
    })

    const updatedCtx = await contentstackPlugin.identify?.(ctx)

    const snapIntegrationsObj = updatedCtx?.event?.integrations['Contentstack']
    expect(snapIntegrationsObj['createAttributes']).toEqual(true)
  })

})
