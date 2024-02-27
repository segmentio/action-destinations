import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { COPY, ROOT, mapEvent } from '@segment/actions-shared'
import { trackPurchaseFields } from '@segment/actions-shared'
import {
  addName,
  enjoinInteger,
  enjoinNumber,
  enjoinString,
  parseDate,
  removeCustomerIfNoId
} from '@segment/actions-shared'

export const browserTrackPurchaseFields = trackPurchaseFields({})

// see https://segment.com/docs/config-api/fql/
export const trackPurchaseDefaultSubscription = 'event = "Order Completed"'

const trackPurchasePub: EventMap = {
  fields: {
    orderId: { name: 'id', convert: enjoinString as ConvertFun },
    amount: { convert: enjoinNumber as ConvertFun },
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
        sku: { convert: enjoinString as ConvertFun },
        name: COPY,
        quantity: { convert: enjoinInteger as ConvertFun },
        price: { convert: enjoinNumber as ConvertFun },
        description: COPY,
        category: COPY,
        url: COPY,
        image_url: { name: 'imageUrl' }
      }
    },

    // CUSTOMER FIELDS
    customerId: { name: ['customer', 'id'], convert: enjoinString as ConvertFun },
    anonymousId: { name: ['customer', 'anonymousId'] },
    email: { name: ['customer', 'email'] },
    isNewCustomer: { name: ['customer', 'isNewCustomer'] },
    loyaltyStatus: { name: ['customer', 'loyaltyStatus'] },
    firstName: { name: ['customer', 'firstName'] },
    lastName: { name: ['customer', 'lastName'] },
    name: { name: ['customer', 'name'] },
    age: { name: ['customer', 'age'], convert: enjoinInteger as ConvertFun },
    // fbt-merchant-api complains about birthday being an object but passes it anyway.
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
  fields: browserTrackPurchaseFields,

  perform: (friendbuyAPI, { payload }) => {
    addName(payload)
    const friendbuyPayload = mapEvent(trackPurchasePub, payload as unknown as AnalyticsPayload)
    friendbuyAPI.push(['track', 'purchase', friendbuyPayload, true])
  }
}

export default action
