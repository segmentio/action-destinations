import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'
import { GA } from '../types'

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
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: GA
  let viewItemListEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    viewItemListEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = {
        gtag: jest.fn()
      }
      return Promise.resolve(mockGA4.gtag)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 viewItemList Event', async () => {
    const context = new Context({
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

    await viewItemListEvent.track?.(context)

    expect(mockGA4.gtag).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('view_item_list'),
      expect.objectContaining({
        item_list_id: 12321,
        item_list_name: 'Monopoly: 3rd Edition',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }]
      })
    )
  })
})
