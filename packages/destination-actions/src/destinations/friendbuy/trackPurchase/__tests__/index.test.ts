import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONValue } from '@segment/actions-core'
import Destination from '../../index'

import { trackUrl } from '../../index'
import { base64Decode } from '../../base64'
import { get } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const splitUrlRe = /^(\w+:\/\/[^/]+)(.*)/

describe('Friendbuy.trackPurchase', () => {
  test('all fields', async () => {
    const [_, trackSchemeAndHost, trackPath] = splitUrlRe.exec(trackUrl) || []

    nock(trackSchemeAndHost)
      .get(new RegExp('^' + trackPath))
      .reply(200, {})

    const orderId = 'my order'
    const products = [
      { sku: 'sku1', name: 'shorts', price: 19.99, quantity: 2 },
      { sku: 'sku2', price: 5.99 }
    ]
    const amount = products.reduce((acc, p) => acc + p.price * (p.quantity ?? 1), 0)

    const merchantId = '1993d0f1-8206-4336-8c88-64e170f2419e'
    const userId = 'john-doe-12345'
    const currency = 'USD'
    const anonymousId = 'fda703c1-ea45-4198-87bc-2e769437352a'
    const coupon = 'coupon-xyzzy'
    const giftCardCodes = ['card-a', 'card-b']
    const friendbuyAttributes = { referralCode: 'ref-plugh' }
    const email = 'john.doe@example.com'
    const name = 'John Doe'

    const event = createTestEvent({
      type: 'track',
      event: 'Order Completed',
      userId,
      anonymousId,
      properties: {
        order_id: orderId,
        total: amount,
        currency,
        coupon,
        giftCardCodes,
        products: products as JSONValue,
        email,
        name,
        friendbuyAttributes
      },
      timestamp: '2021-10-05T15:30:35Z'
    })

    const r = await testDestination.testAction('trackPurchase', {
      event,
      settings: { merchantId },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(1)
    expect(r[0].options.searchParams).toMatchObject({
      type: 'purchase',
      merchantId,
      metadata: expect.any(String),
      payload: expect.any(String)
    })
    const searchParams = r[0].options.searchParams as Record<string, string>

    const metadata = JSON.parse(base64Decode(searchParams.metadata))
    // console.log("metadata", metadata)
    expect(metadata).toMatchObject({
      url: get(event.context, ['page', 'url']),
      title: get(event.context, ['page', 'title']),
      ipAddress: get(event.context, ['ip'])
    })

    const payload = JSON.parse(decodeURIComponent(base64Decode(searchParams.payload)))
    // console.log("payload", JSON.stringify(payload, null, 2))
    expect(payload).toMatchObject({
      purchase: {
        id: orderId,
        amount,
        currency,
        couponCode: coupon,
        giftCardCodes,
        customer: { id: userId, anonymousId, email, name },
        products,
        ...friendbuyAttributes
      }
    })
  })
})
