import { Subscription } from '@segment/browser-destination-runtime/types'
import { Analytics, Context } from '@segment/analytics-next'
import googleAnalytics4Web, { destination } from '../index'

const subscriptions: Subscription[] = [
  {
    partnerAction: 'removeFromCart',
    name: 'Remove from cart',
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

describe('GoogleAnalytics4Web.removeFromCart', () => {
  const settings = {
    measurementID: 'test123'
  }

  let mockGA4: typeof gtag
  let removeFromCartEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()

    const [trackEventPlugin] = await googleAnalytics4Web({
      ...settings,
      subscriptions
    })
    removeFromCartEvent = trackEventPlugin

    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockGA4 = jest.fn()
      return Promise.resolve(mockGA4)
    })
    await trackEventPlugin.load(Context.system(), {} as Analytics)
  })

  test('GA4 removeFromCart Event when send to is false', async () => {
    const context = new Context({
      event: 'Remove from Cart',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10,
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

    await removeFromCartEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('remove_from_cart'),
      expect.objectContaining({
        currency: 'USD',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        value: 10,
        send_to: 'default'
      })
    )
  })
  test('GA4 removeFromCart Event when send to is true', async () => {
    const context = new Context({
      event: 'Remove from Cart',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10,
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

    await removeFromCartEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('remove_from_cart'),
      expect.objectContaining({
        currency: 'USD',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        value: 10,
        send_to: settings.measurementID
      })
    )
  })

  test('GA4 removeFromCart Event when send to is undefined', async () => {
    const context = new Context({
      event: 'Remove from Cart',
      type: 'track',
      properties: {
        currency: 'USD',
        value: 10,
        products: [
          {
            product_id: '12345',
            name: 'Monopoly: 3rd Edition',
            currency: 'USD'
          }
        ]
      }
    })

    await removeFromCartEvent.track?.(context)

    expect(mockGA4).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('remove_from_cart'),
      expect.objectContaining({
        currency: 'USD',
        items: [{ currency: 'USD', item_id: '12345', item_name: 'Monopoly: 3rd Edition' }],
        value: 10,
        send_to: 'default'
      })
    )
  })
})
