import { Analytics, Context, JSONValue } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackPurchaseObject, { trackPurchaseDefaultSubscription, trackPurchaseFields } from '../index'

import { loadScript } from '../../../../runtime/load-script'
jest.mock('../../../../runtime/load-script')
beforeEach(async () => {
  // Prevent friendbuy.js and campaigns.js from being loaded.
  ;(loadScript as jest.Mock).mockResolvedValue(true)
})

describe('Friendbuy.trackPurchase', () => {
  const subscriptions = [
    {
      partnerAction: 'trackPurchase',
      name: trackPurchaseObject.title,
      enabled: true,
      subscribe: trackPurchaseDefaultSubscription,
      mapping: Object.fromEntries(Object.entries(trackPurchaseFields).map(([name, value]) => [name, value.default]))
    }
  ]

  test('all fields', async () => {
    const orderId = 'my order'
    const products = [
      { sku: 'sku1', name: 'shorts', price: 19.99, quantity: 2 },
      { sku: 'sku2', price: 5.99 }
    ]

    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const currency = 'USD'
    const coupon = 'coupon-xyzzy'

    const [trackPurchase] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    // console.log('trackPurchase', JSON.stringify(trackPurchase, null, 2), trackPurchase)
    expect(trackPurchase).toBeDefined()

    await trackPurchase.load(Context.system(), {} as Analytics)

    // console.log(window.friendbuyAPI)
    jest.spyOn(window.friendbuyAPI as any, 'push')

    const expectedProducts = products.map((p) => ({ quantity: 1, ...p }))
    const amount = expectedProducts.reduce((acc, p) => acc + p.price * p.quantity, 0)

    {
      // all fields
      const context1 = new Context({
        type: 'track',
        event: 'Order Completed',
        userId,
        properties: {
          order_id: orderId,
          revenue: amount,
          subtotal: amount + 1,
          total: amount + 2,
          currency,
          coupon,
          products: products as JSONValue
        }
      })
      // console.log('context1', JSON.stringify(context1, null, 2))

      trackPurchase.track?.(context1)

      // console.log('trackPurchase request', JSON.stringify(window.friendbuyAPI.push.mock.calls[0], null, 2))
      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(1, [
        'track',
        'purchase',
        {
          id: orderId,
          amount: amount + 2, // amount defaults to total
          currency,
          couponCode: coupon,
          customer: { id: userId },
          products: expectedProducts
        }
      ])
    }

    {
      // minimal event
      const context2 = new Context({
        type: 'track',
        event: 'Order Completed',
        properties: {
          order_id: orderId,
          total: amount,
          currency
        }
      })

      trackPurchase.track?.(context2)

      expect(window.friendbuyAPI?.push).toHaveBeenNthCalledWith(2, [
        'track',
        'purchase',
        {
          id: orderId,
          amount,
          currency
        }
      ])
    }
  })
})
