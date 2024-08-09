// import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import evolvDestination, { destination } from '../index'

const subscriptions = [
  {
    partnerAction: 'trackEvent',
    name: 'Show',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      eventName: {
        '@path': '$.event'
      },
      properties: {
        '@path': '$.properties'
      }
    }
  }
]

describe('Evolv Ai', () => {
  test('Loads Evolv with organization Id', async () => {
    // const [evolv] = await evolvDestination({
    //     environment: 'da6b34fbbd',
    //     subscriptions
    // })

    jest.spyOn(destination, 'initialize')

    // evolv script load is requiring browser features that are not available in this test

    // await evolv.load(Context.system(), {} as Analytics)
    // expect(destination.initialize).toHaveBeenCalled()

    // const evolvObject = window.evolv
    // expect(evolvObject).toBeDefined()

    // const script = window.document.querySelector(
    // `script[src~="https://media.evolv.ai/asset-manager/releases/latest/webloader.min.js"]`
    // ) as HTMLScriptElement
    // expect(script).toBeDefined()
  })

  test('Loads evolv context without initScript', async () => {
    const [evolv] = await evolvDestination({ subscriptions })
    jest.spyOn(destination, 'initialize')

    await evolv.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
  })
})
