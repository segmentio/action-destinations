import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
import { GA } from '../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'search',
    name: 'search',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      search_term: {
        '@path': '$.properties.search_term'
      }
    }
  }
]

describe('GoogleAnalytics4Web.search', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: GA
  let searchEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    searchEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = {
        gtag: jest.fn()
      }
      return Promise.resolve(mockGA4.gtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 search Event', async () => {
    const context = new Context({
      event: 'search',
      type: 'track',
      properties: {
        search_term: 'Monopoly: 3rd Edition'
      }
    })

    await searchEvent.track?.(context)

    expect(mockGA4.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('search'),
      expect.objectContaining({
        search_term: 'Monopoly: 3rd Edition'
      })
    )
  })
})
