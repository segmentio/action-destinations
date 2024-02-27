import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import hubspotDestination, { destination } from '../../index'
import { Hubspot } from '../../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'trackPageView',
    name: 'Track Page View',
    enabled: true,
    subscribe: 'type = "page"',
    mapping: {
      path: {
        '@path': '$.context.page.path'
      }
    }
  }
]

describe('Hubspot.trackPageView', () => {
  const settings = {
    portalId: '1234'
  }

  let mockHubspot: Hubspot
  let trackPageViewEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackPageViewEventPlugin] = await hubspotDestination({
      ...settings,
      subscriptions
    })
    trackPageViewEvent = trackPageViewEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockHubspot = {
        push: jest.fn()
      }
      return Promise.resolve(mockHubspot)
    })
    await trackPageViewEvent.load(Context.system(), {} as Analytics)
  })

  test('call both trackPageView and setPath', async () => {
    const context = new Context({
      type: 'page',
      name: 'Fried Chicken 🍗',
      category: 'Chicken Shop',
      context: {
        page: {
          path: '/fried-chicken'
        }
      }
    })
    await trackPageViewEvent.track?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(2)
    expect(mockHubspot.push).toHaveBeenCalledWith(['trackPageView'])
    expect(mockHubspot.push).toHaveBeenCalledWith(['setPath', '/fried-chicken'])
  })

  test('only calls trackPageView if no path is provided', async () => {
    const context = new Context({
      type: 'page',
      name: 'Spicy Chicken Sandwich 🌶',
      category: 'Chicken Shop'
    })
    await trackPageViewEvent.track?.(context)
    expect(mockHubspot.push).toHaveBeenCalledTimes(1)
    expect(mockHubspot.push).toHaveBeenCalledWith(['trackPageView'])
  })
})
