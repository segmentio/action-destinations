import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, EventMap } from '../shared/mapEvent'

import { createRequestParams, mapiUrl } from '../cloudUtil'
import { commonCustomerFields } from '../shared/commonFields'
import { contextFields } from '../shared/contextFields'
import { COPY, DROP, mapEvent } from '../shared/mapEvent'
import { trackPurchaseFields } from '../shared/sharedPurchase'

const trackPurchaseMapi: EventMap = {
  fields: {
    orderId: COPY,
    amount: COPY,
    currency: COPY,
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,
    giftCardCodes: COPY,

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
    customerId: COPY,
    // anonymousID (unmapped)
    email: COPY,
    firstName: COPY,
    lastName: COPY,
    // name (unmapped)
    isNewCustomer: COPY,
    // loyaltyStatus (unmapped)
    age: DROP, // currently not handled properly at root or in additionalProperties
    birthday: DROP, // currently not handled properly at root or in additionalProperties

    // Context fields.
    ipAddress: COPY,
    userAgent: COPY,
    pageUrl: DROP,
    pageTitle: DROP
  },
  unmappedFieldObject: 'additionalProperties'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Purchase',
  description: 'Record when a customer makes a purchase.',
  fields: Object.assign({}, trackPurchaseFields, commonCustomerFields(false), contextFields),

  perform: async (request, { settings, payload }) => {
    const friendbuyPayload = mapEvent(trackPurchaseMapi, payload as unknown as AnalyticsPayload)

    if (!friendbuyPayload) {
      return undefined
    }

    const requestParams = await createRequestParams(request, settings, friendbuyPayload)
    return request(`${mapiUrl}/v1/event/purchase`, requestParams)
  }
}

export default action
