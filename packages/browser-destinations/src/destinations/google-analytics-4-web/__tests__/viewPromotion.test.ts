import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'viewPromotion',
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
describe('GoogleAnalytics4Web.viewPromotion', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.viewPromotion.perform = jest.fn(destination.actions.viewPromotion.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
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
    )
    expect(destination.actions.viewPromotion.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          creative_name: 'summer_banner2',
          creative_slot: 'featured_app_1',
          location_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
          promotion_id: 'P_12345',
          promotion_name: 'Summer Sale',
          items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }]
        }
      })
    )
  })
})
