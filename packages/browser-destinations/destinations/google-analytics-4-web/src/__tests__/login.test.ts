import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'login',
    name: 'Login',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      method: {
        '@path': '$.properties.method'
      }
    }
  }
]

describe('GoogleAnalytics4Web.login', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: GA
  let loginEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    loginEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 login Event', async () => {
    const context = new Context({
      event: 'Login',
      type: 'track',
      properties: {
        method: 'Google'
      }
    })
    await loginEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('login'),
      expect.objectContaining({
        method: 'Google'
      })
    )
  })
})
