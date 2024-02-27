import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'generateLead',
    name: 'Generate Leaad',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      currency: {
        '@path': '$.properties.currency'
      },
      value: {
        '@path': '$.properties.value'
      },
      send_to: {
        '@path': '$.properties.send_to'
      }
    }
  }
]

describe('GoogleAnalytics4Web.generateLead', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: typeof gtag
  let generateLeadEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    generateLeadEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 generateLead Event when send to is false', async () => {
    const context = new Context({
      event: 'Generate Lead',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10,
        send_to: false
      }
    })
    await generateLeadEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('generate_lead'),
      expect.objectContaining({
        currency: 'USD',
        value: 10,
        send_to: 'default'
      })
    )
  })
  test('GA4 generateLead Event when send to is true', async () => {
    const context = new Context({
      event: 'Generate Lead',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10,
        send_to: true
      }
    })
    await generateLeadEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('generate_lead'),
      expect.objectContaining({
        currency: 'USD',
        value: 10,
        send_to: settings.measurementID
      })
    )
  })
  test('GA4 generateLead Event when send to is undefined', async () => {
    const context = new Context({
      event: 'Generate Lead',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10
      }
    })
    await generateLeadEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('generate_lead'),
      expect.objectContaining({
        currency: 'USD',
        value: 10,
        send_to: 'default'
      })
    )
  })
})
