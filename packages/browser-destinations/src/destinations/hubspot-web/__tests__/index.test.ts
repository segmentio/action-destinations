import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import hubspotDestination, { destination } from '../index'

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
  test('loads hubspot analytics with just a HubID', async () => {
    const [event] = await hubspotDestination({
      portalId: '12345',
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const hsScript = window.document.querySelector('#hs-analytics') as HTMLScriptElement
    const hsForms = window.document.querySelector(
      'script[src~="https://js.hsforms.net/forms/v2.js"]'
    ) as HTMLScriptElement

    expect(hsScript).toBeDefined()
    expect(hsForms).toBeNull()
    expect(hsScript?.src).toContain('https://js.hs-analytics.net/analytics')
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

    const hsScript = window.document.querySelector('#hs-analytics') as HTMLScriptElement

    expect(hsScript).toBeDefined()
    expect(hsScript?.src).toContain('https://js-eu1.hs-analytics.net')
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

    const hsScript = window.document.querySelector('#hs-analytics') as HTMLScriptElement
    const hsForms = window.document.querySelector(
      'script[src~="https://js.hsforms.net/forms/v2.js"]'
    ) as HTMLScriptElement

    expect(hsScript).toBeDefined()
    expect(hsForms).toBeDefined()
  })
})
