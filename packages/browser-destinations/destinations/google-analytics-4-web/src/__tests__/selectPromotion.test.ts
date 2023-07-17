import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
import { GA } from '../types'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'selectPromotion',
    name: 'Select Promotion',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      creative_name: {
        '@path': '$.properties.creative_name'
      },
      creative_slot: {
        '@path': '$.properties.creative_slot'
      },
      location_id: {
        '@path': '$.properties.location_id'
      },
      promotion_id: {
        '@path': '$.properties.promotion_id'
      },
      promotion_name: {
        '@path': '$.properties.promotion_name'
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

describe('GoogleAnalytics4Web.selectPromotion', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: GA
  let selectPromotionEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    selectPromotionEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = {
        gtag: jest.fn()
      }
      return Promise.resolve(mockGA4.gtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 selectPromotion Event', async () => {
    const context = new Context({
      event: 'Select Promotion',
      type: 'track',
      properties: {
        creative_name: 'summer_banner2',
        creative_slot: 'featured_app_1',
        location_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
        promotion_id: 'P_12345',
        promotion_name: 'Summer Sale',
        products: [
          {
            product_id: '12345',
            name: 'Monopoly: 3rd Edition',
            currency: 'USD'
          }
        ]
      }
    })

    await selectPromotionEvent.track?.(context)

    expect(mockGA4.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('select_promotion'),
      expect.objectContaining({
        creative_name: 'summer_banner2',
        creative_slot: 'featured_app_1',
        location_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
        promotion_id: 'P_12345',
        promotion_name: 'Summer Sale',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }]
      })
    )
  })
})
