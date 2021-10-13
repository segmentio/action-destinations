import { Analytics, Context } from '@segment/analytics-next'
import friendbuyDestination from '../../index'
import trackPurchase from '../index'

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
      name: trackPurchase.title,
      enabled: true,
      subscribe: trackPurchase.defaultSubscription,
      mapping: Object.fromEntries(Object.entries(trackPurchase.fields).map(([name, value]) => [name, value.default]))
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

    const [trackPurchase] = await friendbuyDestination({
      merchantId,
      subscriptions
    })
    // console.log('trackPurchase', JSON.stringify(trackPurchase, null, 2), trackPurchase)
    expect(trackPurchase).toBeDefined()

    await trackPurchase.load(Context.system(), {} as Analytics)

    // console.log(window.friendbuyAPI)
    jest.spyOn(window.friendbuyAPI, 'push').mockImplementation(() => true)

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
          products: products as JSONValue
        }
      })
      // console.log('context1', JSON.stringify(context1, null, 2))

      trackPurchase.track?.(context1)

      // console.log('trackPurchase request', JSON.stringify(window.friendbuyAPI.push.mock.calls[0], null, 2))
      expect(window.friendbuyAPI.push).toHaveBeenNthCalledWith(1, [
        'track',
        'purchase',
        {
          id: orderId,
          amount: amount + 2, // amount defaults to total
          currency,
          customer: { id: userId },
          products: expectedProducts
        }
      ])
    }

    {
      // missing total
      const context2 = new Context({
        type: 'track',
        event: 'Order Completed',
        userId,
        properties: {
          order_id: orderId,
          subtotal: amount + 1,
          currency,
          products: products as JSONValue
        }
      })

      trackPurchase.track?.(context2)

      expect(window.friendbuyAPI.push).toHaveBeenNthCalledWith(2, [
        'track',
        'purchase',
        {
          id: orderId,
          amount: amount + 1, // amount defaults to subtotal when total missing
          currency,
          customer: { id: userId },
          products: expectedProducts
        }
      ])
    }

    {
      // missing total and subtotal
      const context3 = new Context({
        type: 'track',
        event: 'Order Completed',
        userId,
        properties: {
          order_id: orderId,
          revenue: amount,
          currency,
          products: products as JSONValue
        }
      })

      trackPurchase.track?.(context3)

      expect(window.friendbuyAPI.push).toHaveBeenNthCalledWith(3, [
        'track',
        'purchase',
        {
          id: orderId,
          amount, // amount defaults to revenue when total and subtotal missing
          currency,
          customer: { id: userId },
          products: expectedProducts
        }
      ])
    }
  })
})
