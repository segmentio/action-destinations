import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { createMapiRequest } from '../cloudUtil'
import { contextFields } from '@segment/actions-shared'
import { COPY, DROP, mapEvent } from '@segment/actions-shared'
import { trackPurchaseFields } from '@segment/actions-shared'
import { enjoinInteger, enjoinNumber, enjoinString } from '@segment/actions-shared'

const cloudTrackPurchaseFields = { ...trackPurchaseFields({}), ...contextFields }

const trackPurchaseMapi: EventMap = {
  fields: {
    orderId: { convert: enjoinString as ConvertFun },
    amount: { convert: enjoinNumber as ConvertFun },
    currency: COPY,
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,
    giftCardCodes: COPY,

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

    // CONTEXT FIELDS
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
  fields: cloudTrackPurchaseFields,

  perform: async (request, { settings, payload }) => {
    const friendbuyPayload = mapEvent(trackPurchaseMapi, payload as unknown as AnalyticsPayload)
    const [requestUrl, requestParams] = await createMapiRequest(
      'v1/event/purchase',
      request,
      settings,
      friendbuyPayload
    )
    return request(requestUrl, requestParams)
  }
}

export default action
