import { Analytics, Context, JSONObject, Plugin} from '@segment/analytics-next'
import snap, { destination } from '..'
import { Subscription } from '@segment/browser-destination-runtime/types'
import browserPluginsDestination from '../..'
import { clickIdIntegrationFieldName, clickIdQuerystringName, storageSCIDCookieKey, scidIntegrationFieldName }  from '../utils'

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
      search: '',
    },
    writable: true,
  });

})


describe('ajs-integration', () => {
  test('updates the original event with a Snap clientId from the querystring', async () => {
    
    Object.defineProperty(window, 'location', {
      value: {
        search: `?${clickIdQuerystringName}=dummyValue`,
      },
      writable: true,
    });

    await snapPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await snapPlugin.track?.(ctx)

    let snapIntegrationsObj = updatedCtx?.event?.integrations['Snap Conversions Api']

    expect(snapIntegrationsObj[clickIdIntegrationFieldName]).toEqual('dummyValue')

  })


  test('updates the original event with a Snap cookie value', async () => {
    
    document.cookie = `${storageSCIDCookieKey}=dummyValue`;

    await snapPlugin.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'Test Event',
      properties: {
        greeting: 'Yo!'
      }
    })

    const updatedCtx = await snapPlugin.track?.(ctx)
    console.log('12345678')
 

    let snapIntegrationsObj = updatedCtx?.event?.integrations['Snap Conversions Api']
    expect(snapIntegrationsObj[scidIntegrationFieldName]).toEqual('dummyValue')

  })


  
})
