import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
import { GA } from '../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'customEvent',
    name: 'Custom Event',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      name: {
        '@path': '$.event'
      },
      params: {
        '@path': '$.properties.params'
      }
    }
  }
]

describe('GoogleAnalytics4Web.customEvent', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: GA
  let customEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    customEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = {
        gtag: jest.fn()
      }
      return Promise.resolve(mockGA4.gtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 customEvent Event', async () => {
    const context = new Context({
      event: 'Custom Event',
      type: 'track',
      properties: {
        params: [
          {
            paramOne: 'test123',
            paramTwo: 'test123',
            paramThree: 123
          }
        ]
      }
    })
    await customEvent.track?.(context)

    expect(mockGA4.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('Custom_Event'),
      expect.objectContaining([{ paramOne: 'test123', paramThree: 123, paramTwo: 'test123' }])
    )
  })
})
