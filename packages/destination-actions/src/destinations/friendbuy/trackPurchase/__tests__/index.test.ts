import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONValue } from '@segment/actions-core'
import Destination from '../../index'

import { mapiUrl } from '../../cloudUtil'
import { nockAuth, authKey, authSecret } from '../../__tests__/cloudUtil.mock'

const testDestination = createTestIntegration(Destination)

describe('Friendbuy.trackPurchase', () => {
  test('all fields', async () => {
    nockAuth()
    nock(mapiUrl).post('/v1/event/purchase').reply(200, {})

    const orderId = 'my order'
    const products = [
      { sku: 'sku1', name: 'shorts', price: 19.99, quantity: 2 },
      { sku: 'sku2', price: 5.99 }
    ]
    const amount = products.reduce((acc, p) => acc + p.price * (p.quantity ?? 1), 0)
    const expectedProducts = products.map((p) => ({ name: 'unknown', quantity: 1, ...p }))

    const userId = 'john-doe-12345'
    const currency = 'USD'
    const anonymousId = 'fda703c1-ea45-4198-87bc-2e769437352a'
    const coupon = 'coupon-xyzzy'
    const attributionId = '2d3dafb7-2e1c-42bd-bcad-1eeb22445178'
    const referralCode = 'ref-plugh'
    const giftCardCodes = ['card-a', 'card-b']
    const email = 'john.doe@example.com'
    const isNewCustomer = false
    const loyaltyStatus = 'out'
    const firstName = 'John'
    const lastName = 'Doe'
    const name = `${firstName} ${lastName}`
    const age = 42
    const birthday = '0000-12-25'

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
        attributionId,
        giftCardCodes,
        products: products as JSONValue,
        email,
        isNewCustomer,
        loyaltyStatus,
        firstName,
        lastName,
        name,
        age,
        birthday,
        friendbuyAttributes: { attributionId, referralCode }
      },
      timestamp: '2021-10-05T15:30:35Z'
    })

    const r = await testDestination.testAction('trackPurchase', {
      event,
      settings: { authKey, authSecret },
      useDefaultMappings: true
      // mapping,
      // auth,
    })

    // console.log(JSON.stringify(r, null, 2))
    expect(r.length).toBe(2) // auth request + trackPurchase request
    expect(r[1].options.json).toEqual({
      orderId,
      amount,
      currency,
      couponCode: coupon,
      attributionId,
      referralCode,
      giftCardCodes,
      customerId: userId,
      email,
      isNewCustomer,
      firstName,
      lastName,
      products: expectedProducts,
      ipAddress: event?.context?.ip,
      userAgent: event?.context?.userAgent,
      additionalProperties: {
        // age, // dropped because not string.
        anonymousId,
        name,
        // birthday: { month: 12, day: 25 }, // dropped because not string.
        loyaltyStatus
      }
    })
  })
})
