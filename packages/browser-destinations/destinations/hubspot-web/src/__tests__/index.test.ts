import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import hubspotDestination, { destination } from '../index'
import nock from 'nock'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackCustomBehavioralEvent',
    name: 'Track Custom Behavioral Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      event_name: {
        '@path': '$.event'
      }
    }
  }
]

describe('Hubspot Web (Actions)', () => {
  beforeEach(() => {
    nock('https://js.hs-scripts.com/').get('/12345.js').reply(200, "window._hsq = '🇺🇸'")
    nock('https://js-eu1.hs-scripts.com/').get('/12345.js').reply(200, "window._hsq = '🇪🇺'")
    nock('https://https://js.hsforms.net').get('forms/v2.js').reply(200, "window.hbspt = {forms: '1232'}")
  })
  test('loads hubspot analytics with just a HubID', async () => {
    const [event] = await hubspotDestination({
      portalId: '12345',
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    expect(window._hsq).toEqual('🇺🇸')
    expect(window.hbspt).toBeUndefined()
  })

  test('loads hubspot script with id=hs-script-loader to prevent duplicate script injection', async () => {
    const [event] = await hubspotDestination({
      portalId: '12345',
      subscriptions
    })

    await event.load(Context.system(), {} as Analytics)

    const loaderScripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script#hs-script-loader'))
    expect(loaderScripts).toHaveLength(1)
    expect(loaderScripts[0].src).toBe('https://js.hs-scripts.com/12345.js')
  })

  test('loads hubspot analytics with EU script', async () => {
    const [event] = await hubspotDestination({
      portalId: '12345',
      enableEuropeanDataCenter: true,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window._hsq).toEqual('🇪🇺')
    expect(window.hbspt).toBeUndefined()
  })

  test('loads hubspot forms SDK', async () => {
    const [event] = await hubspotDestination({
      portalId: '12345',
      loadFormsSDK: true,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    expect(window._hsq).toEqual('🇺🇸')
    expect(window.hbspt).toBeDefined()
  })
})
