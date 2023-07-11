import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
import { GA } from '../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'refund',
    name: 'refund',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      currency: {
        '@path': '$.properties.currency'
      },
      value: {
        '@path': '$.properties.value'
      },
      coupon: {
        '@path': '$.properties.coupon'
      },
      transaction_id: {
        '@path': '$.properties.transaction_id'
      },
      items: [
        {
          item_name: {
            '@path': `$.properties.products.0.name`
          },
          item_id: {
            '@path': `$.properties.products.0.product_id`
          },
          currency: {
            '@path': `$.properties.products.0.currency`
          },
          price: {
            '@path': `$.properties.products.0.price`
          },
          quantity: {
            '@path': `$.properties.products.0.quantity`
          }
        }
      ]
    }
  }
]

describe('GoogleAnalytics4Web.refund', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: GA
  let refundEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    refundEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = {
        gtag: jest.fn()
      }
      return Promise.resolve(mockGA4.gtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 Refund Event', async () => {
    const context = new Context({
      event: 'Refund',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10,
        transaction_id: 12321,
        products: [
          {
            product_id: '12345',
            name: 'Monopoly: 3rd Edition',
            currency: 'USD'
          }
        ]
      }
    })
    await refundEvent.track?.(context)

    expect(mockGA4.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('refund'),
      expect.objectContaining({
        currency: 'USD',
        transaction_id: 12321,
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        value: 10
      })
    )
  })
})
