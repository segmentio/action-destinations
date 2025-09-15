import { Analytics, Context, Plugin } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime/types'
import redditPluginsDestination from '../'
import {
  clickIdIntegrationFieldName,
  clickIdQuerystringName,
  rdtUUIDIntegrationFieldName,
  rdtCookieName
} from '../utils'

const example: Subscription[] = [
  {
    partnerAction: 'redditPlugin',
    name: 'Reddit Browser Plugin',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Plugin[]
let redditPlugin: Plugin
let ajs: Analytics

beforeEach(async () => {
  browserActions = await redditPluginsDestination({ subscriptions: example })
  redditPlugin = browserActions[0] // Get the first plugin instance

  ajs = new Analytics({
    writeKey: 'w_123'
  })

  Object.defineProperty(window, 'location', {
    value: {
      search: ''
    },
    writable: true
  })
  document.cookie = `${rdtCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
})

describe('ajs-integration', () => {
  test('updates the original event with a Reddit click_id from the querystring', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: `?${clickIdQuerystringName}=dummyQuerystringValue`
      },
      writable: true
    })

    await redditPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Hello Reddit!'
      }
    })

    const updatedCtx = await redditPlugin.track?.(ctx)

    const redditIntegrationsObj = updatedCtx?.event?.integrations?.['Reddit Conversions Api']

    expect(redditIntegrationsObj?.[clickIdIntegrationFieldName]).toEqual('dummyQuerystringValue')
  })

  test('updates the original event with a Reddit rdt_uuid cookie value', async () => {
    document.cookie = `${rdtCookieName}=dummyCookieValue`

    await redditPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Hello Reddit!'
      }
    })

    const updatedCtx = await redditPlugin.track?.(ctx)

    const redditIntegrationsObj = updatedCtx?.event?.integrations?.['Reddit Conversions Api']

    expect(redditIntegrationsObj?.[rdtUUIDIntegrationFieldName]).toEqual('dummyCookieValue')
  })
})
