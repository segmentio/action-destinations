import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../'
import { queryIdIntegrationFieldName } from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'algoliaPlugin',
    name: 'Algolia Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let algoliaPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example })
  algoliaPlugin = browserActions[0]

  ajs = new Analytics({
    writeKey: 'w_123'
  })
})

describe('ajs-integration', () => {
  test('updates the original event with an Algolia query ID', async () => {
    await algoliaPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await algoliaPlugin.track?.(ctx)

    const algoliaIntegrationsObj = updatedCtx?.event?.integrations['Algolia Insights (Actions)']
    expect(algoliaIntegrationsObj[queryIdIntegrationFieldName]).toEqual('test_data')
  })
})
