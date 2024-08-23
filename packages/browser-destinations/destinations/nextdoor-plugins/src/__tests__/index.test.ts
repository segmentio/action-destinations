import { Analytics, Context, JSONValue, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../'
import { clickIdIntegrationFieldName, clickIdQuerystringName, CLOUD_INTEGRATION_NAME } from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'nextdoorPlugin',
    name: 'Nextdoor Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let nextdoorPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await browserPluginsDestination({ subscriptions: example } as unknown as JSONValue)
  nextdoorPlugin = browserActions[0]

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
  test('updates the original event with a Nextdoor click_id from the querystring', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: `?${clickIdQuerystringName}=dummyQuerystringValue`
      },
      writable: true
    })

    await nextdoorPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = (await nextdoorPlugin.track?.(ctx)) as Context

    const nextdoorIntegrationsObj = updatedCtx?.event?.integrations[CLOUD_INTEGRATION_NAME] as Record<string, any>

    expect(nextdoorIntegrationsObj[clickIdIntegrationFieldName]).toEqual('dummyQuerystringValue')
  })
})
