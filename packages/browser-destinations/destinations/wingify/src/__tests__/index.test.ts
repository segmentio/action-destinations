import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import wingifyDestination, { destination } from '../index'

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

describe('Wingify Web (Actions)', () => {
  test('Loads Wingify SmartCode with AccountID', async () => {
    const [wingify] = await wingifyDestination({
      wingifyAccountId: 654331,
      addSmartcode: true,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await wingify.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const wingifyObject = window.Wingify
    expect(wingifyObject).toBeDefined()

    const script = window.document.querySelector(
      'script[src~="https://edge.wingify.net/tag/654331.js"]'
    ) as HTMLScriptElement
    expect(script).not.toBeNull()
    expect(script.src).toContain('https://edge.wingify.net/tag/654331.js')
  })

  test('Loads Wingify Object without initScript', async () => {
    const [wingify] = await wingifyDestination({
      wingifyAccountId: 654331,
      addSmartcode: false,
      subscriptions
    })

    jest.spyOn(destination, 'initialize')

    await wingify.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()

    const wingifyObject = window.Wingify
    expect(wingifyObject).toBeDefined()

    const script = window.document.querySelector('script[src~="https://edge.wingify.net/tag/654331.js"]')
    expect(script).toBeNull()
  })
})
