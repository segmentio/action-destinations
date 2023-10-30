import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'signUp',
    name: 'signUp',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      method: {
        '@path': '$.properties.method'
      }
    }
  }
]

describe('GoogleAnalytics4Web.signUp', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: typeof gtag
  let signUpEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    signUpEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 signUp Event', async () => {
    const context = new Context({
      event: 'signUp',
      type: 'track',
      properties: {
        method: 'Google'
      }
    })

    await signUpEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('sign_up'),
      expect.objectContaining({ method: 'Google' })
    )
  })
})
