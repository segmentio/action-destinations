import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { COPY, ROOT, mapEvent } from '@segment/actions-shared'
import { trackPurchaseFields } from '@segment/actions-shared'
import { addName, parseDate, removeCustomerIfNoId } from '@segment/actions-shared'

// see https://segment.com/docs/config-api/fql/
export const trackPurchaseDefaultSubscription = 'event = "Order Completed"'

const trackPurchasePub: EventMap = {
  fields: {
    orderId: { name: 'id' },
    amount: COPY,
    currency: COPY,
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,
    giftCardCodes: {
      type: 'array'
    },

    products: {
      type: 'array',
      defaultObject: { sku: 'unknown', name: 'unknown', quantity: 1 },
      fields: {
        sku: COPY,
        name: COPY,
        quantity: COPY,
        price: COPY,
        description: COPY,
        category: COPY,
        url: COPY,
        image_url: { name: 'imageUrl' }
      }
    },

    // Customer fields.
    customerId: { name: ['customer', 'id'] },
    anonymousId: { name: ['customer', 'anonymousId'] },
    email: { name: ['customer', 'email'] },
    isNewCustomer: { name: ['customer', 'isNewCustomer'] },
    loyaltyStatus: { name: ['customer', 'loyaltyStatus'] },
    firstName: { name: ['customer', 'firstName'] },
    lastName: { name: ['customer', 'lastName'] },
    name: { name: ['customer', 'name'] },
    age: { name: ['customer', 'age'] },
    birthday: { name: ['customer', 'birthday'], convert: parseDate as ConvertFun }
  },
  unmappedFieldObject: ROOT,
  // Documentation of 2021-12-03 claims that both customer.id and
  // customer.email are required, but experimentation shows only customer.id
  // is required by pub trackPurchase.
  finalize: removeCustomerIfNoId
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Purchase',
  description: 'Record when a customer makes a purchase.',
  defaultSubscription: trackPurchaseDefaultSubscription,
  platform: 'web',
  fields: trackPurchaseFields,

  perform: (friendbuyAPI, { payload }) => {
    addName(payload)
    const friendbuyPayload = mapEvent(trackPurchasePub, payload as unknown as AnalyticsPayload)
    friendbuyAPI.push(['track', 'purchase', friendbuyPayload, true])
  }
}

export default action
