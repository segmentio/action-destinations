import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import vwoDestination, { destination } from '../index'

const subscriptions: Subscription[] = [
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

describe('VWO Web (Actions)', () => {
  test('Loads VWO SmartCode with AccountID', async () => {
    const [vwo] = await vwoDestination({
      vwoAccountId: 654331,
      addSmartcode: true,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await vwo.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const vwoObject = window.VWO
    expect(vwoObject).toBeDefined()

    const script = window.document.querySelector(
      'script[src~="https://dev.visualwebsiteoptimizer.com/j.php?a=654331]'
    ) as HTMLScriptElement
    expect(script).toBeDefined()
  })
})
