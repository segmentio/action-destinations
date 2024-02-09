import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'selectItem',
    name: 'Select Item',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {
      item_list_id: {
        '@path': '$.properties.item_list_id'
      },
      item_list_name: {
        '@path': '$.properties.item_list_name'
      },
      send_to: {
        '@path': '$.properties.send_to'
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

describe('GoogleAnalytics4Web.selectItem', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: typeof gtag
  let selectItemEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    selectItemEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 selectItem Event when send to is false', async () => {
    const context = new Context({
      event: 'Select Item',
      type: 'track',
      properties: {
        item_list_id: 12321,
        item_list_name: 'Monopoly: 3rd Edition',
        send_to: false,
        products: [
          {
            product_id: '12345',
            name: 'Monopoly: 3rd Edition',
            currency: 'USD'
          }
        ]
      }
    })

    await selectItemEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('select_item'),
      expect.objectContaining({
        item_list_id: 12321,
        item_list_name: 'Monopoly: 3rd Edition',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        send_to: 'default'
      })
    )
  })
  test('GA4 selectItem Event when send to is true', async () => {
    const context = new Context({
      event: 'Select Item',
      type: 'track',
      properties: {
        item_list_id: 12321,
        item_list_name: 'Monopoly: 3rd Edition',
        send_to: true,
        products: [
          {
            product_id: '12345',
            name: 'Monopoly: 3rd Edition',
            currency: 'USD'
          }
        ]
      }
    })

    await selectItemEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('select_item'),
      expect.objectContaining({
        item_list_id: 12321,
        item_list_name: 'Monopoly: 3rd Edition',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        send_to: settings.measurementID
      })
    )
  })

  test('GA4 selectItem Event when send to is undefined', async () => {
    const context = new Context({
      event: 'Select Item',
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

    await selectItemEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('select_item'),
      expect.objectContaining({
        item_list_id: 12321,
        item_list_name: 'Monopoly: 3rd Edition',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        send_to: 'default'
      })
    )
  })
})
