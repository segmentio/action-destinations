import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

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
      send_to: {
        '@path': '$.properties.send_to'
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
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 customEvent Event when send_to is false', async () => {
    const context = new Context({
      event: 'Custom Event',
      type: 'track',
      properties: {
        send_to: false,
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

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('Custom_Event'),
      expect.objectContaining({
        send_to: 'default',
        ...[{ paramOne: 'test123', paramThree: 123, paramTwo: 'test123' }]
      })
    )
  })

  test('GA4 customEvent Event when send_to is undefined', async () => {
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

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('Custom_Event'),
      expect.objectContaining({
        send_to: 'default',
        ...[{ paramOne: 'test123', paramThree: 123, paramTwo: 'test123' }]
      })
    )
  })

  test('GA4 customEvent Event when send_to is true', async () => {
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
        ],
        send_to: true
      }
    })
    await customEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('Custom_Event'),
      expect.objectContaining({
        send_to: settings.measurementID,
        ...[{ paramOne: 'test123', paramThree: 123, paramTwo: 'test123' }]
      })
    )
  })
})
