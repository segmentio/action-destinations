import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'search',
    name: 'search',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      search_term: {
        '@path': '$.properties.search_term'
      },
      send_to: {
        '@path': '$.properties.send_to'
      }
    }
  }
]

describe('GoogleAnalytics4Web.search', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: typeof gtag
  let searchEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    searchEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 search Event when send to is false', async () => {
    const context = new Context({
      event: 'search',
      type: 'track',
      properties: {
        search_term: 'Monopoly: 3rd Edition',
        send_to: false
      }
    })

    await searchEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('search'),
      expect.objectContaining({
        search_term: 'Monopoly: 3rd Edition',
        send_to: 'default'
      })
    )
  })
  test('GA4 search Event when send to is true', async () => {
    const context = new Context({
      event: 'search',
      type: 'track',
      properties: {
        search_term: 'Monopoly: 3rd Edition',
        send_to: true
      }
    })

    await searchEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('search'),
      expect.objectContaining({
        search_term: 'Monopoly: 3rd Edition',
        send_to: settings.measurementID
      })
    )
  })
  test('GA4 search Event when send to is undefined', async () => {
    const context = new Context({
      event: 'search',
      type: 'track',
      properties: {
        search_term: 'Monopoly: 3rd Edition'
      }
    })

    await searchEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('search'),
      expect.objectContaining({
        search_term: 'Monopoly: 3rd Edition',
        send_to: 'default'
      })
    )
  })
})
