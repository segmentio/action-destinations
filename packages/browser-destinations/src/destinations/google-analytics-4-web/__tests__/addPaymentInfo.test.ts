import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'addPaymentInfo',
    name: 'Add Payment Info',
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
// const payload = {
//   event: 'Payment Info Entered',
//   userId: '1234abc',
//   timestamp: '2022-06-22T22:20:58.905Z',
//   type: 'track',
//   properties: {
//     currency: 'USD',
//     value: 10,
//     coupon: 'SUMMER_FUN',
//     payment_method: 'Credit Card',
//     products: [
//       {
//         product_id: '12345',
//         name: 'Monopoly: 3rd Edition',
//         currency: 'USD'
//       }
//     ]
//   }
// }
describe('GoogleAnalytics4Web.addPaymentInfo', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.addPaymentInfo.perform = jest.fn(destination.actions.addPaymentInfo.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'Payment Info Entered',
        type: 'track',
        properties: {
          currency: 'USD',
          value: 10,
          coupon: 'SUMMER_123',
          payment_method: 'Credit Card',
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
    expect(destination.actions.addPaymentInfo.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          coupon: 'SUMMER_123',
          currency: 'USD',
          items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
          value: 10
        }
      })
    )
  })
})
