import { Subscription } from '../../../lib/browser-destinations'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
const setting = {
  measurementID: 'test123'
}
const subscriptions: Subscription[] = [
  {
    partnerAction: 'viewItemList',
    name: 'View Item List',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      item_list_id: {
        '@path': '$.properties.item_list_id'
      },
      item_list_name: {
        '@path': '$.properties.item_list_name'
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
describe('GoogleAnalytics4Web.viewItemList', () => {
  test('Basic Event with Default Mappings', async () => {
    const [event] = await googleAnalytics4Web({
      ...setting,
      subscriptions
    })
    jest.spyOn(destination, 'initialize')
    destination.actions.viewItemList.perform = jest.fn(destination.actions.viewItemList.perform)
    await event.load(Context.system(), {} as Analytics)
    expect(destination.initialize).toHaveBeenCalled()
    await event.track?.(
      new Context({
        event: 'View Item List',
        type: 'track',
        properties: {
          item_list_id: 12321,
          item_list_name: 'Monopoly: 3rd Edition',
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
    expect(destination.actions.viewItemList.perform).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: {
          item_list_id: 12321,
          item_list_name: 'Monopoly: 3rd Edition',
          items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }]
        }
      })
    )
  })
})
