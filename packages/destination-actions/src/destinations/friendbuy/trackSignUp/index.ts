import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '../shared/mapEvent'

import { createRequestParams, mapiUrl } from '../cloudUtil'
import { contextFields } from '../shared/contextFields'
import { COPY, mapEvent } from '../shared/mapEvent'
import { trackSignUpFields } from '../shared/sharedSignUp'
import { parseDate } from '../shared/util'

const trackSignUpMapi: EventMap = {
  fields: {
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,

    // CUSTOMER FIELDS
    customerId: COPY,
    // anonymousID (unmapped)
    email: COPY,
    // isNewCustomer (unmapped)
    loyaltyStatus: COPY,
    firstName: COPY,
    lastName: COPY,
    // age (unmapped)
    birthday: { convert: parseDate as ConvertFun },

    // CONTEXT FIELDS
    ipAddress: COPY,
    userAgent: COPY
    // pageUrl (unmapped)
    // pageTitle (unmapped)
  },
  unmappedFieldObject: 'additionalProperties'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  fields: Object.assign({}, trackSignUpFields, contextFields),

  perform: async (request, { settings, payload }) => {
    const friendbuyPayload = mapEvent(trackSignUpMapi, payload as unknown as AnalyticsPayload)

    if (!friendbuyPayload) {
      return undefined
    }

    const requestParams = await createRequestParams(request, settings, friendbuyPayload)
    return request(`${mapiUrl}/v1/event/account-sign-up`, requestParams)
  }
}

export default action
