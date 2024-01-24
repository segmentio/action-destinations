import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { createMapiRequest } from '../cloudUtil'
import { contextFields } from '@segment/actions-shared'
import { COPY, DROP, mapEvent } from '@segment/actions-shared'
import { trackSignUpFields } from '@segment/actions-shared'
import { enjoinInteger, enjoinString, parseDate } from '@segment/actions-shared'

const cloudTrackSignUpFields = {
  ...trackSignUpFields({ requireCustomerId: true, requireEmail: true }),
  ...contextFields
}

const trackSignUpMapi: EventMap = {
  fields: {
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,

    // CUSTOMER FIELDS
    customerId: { convert: enjoinString as ConvertFun },
    // anonymousID (unmapped)
    email: COPY,
    isNewCustomer: COPY,
    loyaltyStatus: COPY,
    firstName: COPY,
    lastName: COPY,
    // name (unmapped)
    age: { convert: enjoinInteger as ConvertFun },
    birthday: { convert: parseDate as ConvertFun },

    // CONTEXT FIELDS
    ipAddress: COPY,
    userAgent: COPY,
    pageUrl: DROP,
    pageTitle: DROP
  },
  unmappedFieldObject: 'additionalProperties'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  fields: cloudTrackSignUpFields,

  perform: async (request, { settings, payload }) => {
    const friendbuyPayload = mapEvent(trackSignUpMapi, payload as unknown as AnalyticsPayload)
    const [requestUrl, requestParams] = await createMapiRequest(
      'v1/event/account-sign-up',
      request,
      settings,
      friendbuyPayload
    )
    return request(requestUrl, requestParams)
  }
}

export default action
