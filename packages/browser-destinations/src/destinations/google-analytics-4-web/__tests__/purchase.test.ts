import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'purchase',
    name: 'Purchase',
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
      transection_id: {
        '@path': '$.properties.transection_id'
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
describe('GoogleAnalytics4Web.purchase', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.purchase.perform = jest.fn(destination.actions.purchase.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'Purchase',
        type: 'track',
        properties: {
          currency: 'USD',
          value: 10,
          transection_id: 12321,
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
    expect(destination.actions.purchase.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          currency: 'USD',
          transection_id: 12321,
          items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
          value: 10
        }
      })
    )
  })
})
