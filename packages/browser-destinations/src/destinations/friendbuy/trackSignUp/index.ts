import type { BrowserActionDefinition } from '../../../lib/browser-destinations'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { COPY, ROOT, mapEvent } from '@segment/actions-shared'
import { trackSignUpFields } from '@segment/actions-shared'
import { addName, parseDate } from '@segment/actions-shared'

// see https://segment.com/docs/config-api/fql/
export const trackSignUpDefaultSubscription = 'event = "Signed Up"'

const trackSignUpPub: EventMap = {
  fields: {
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,

    // CUSTOMER FIELDS
    customerId: { name: 'id' },
    anonymousID: COPY,
    isNewCustomer: COPY,
    loyaltyStatus: COPY,
    email: COPY,
    firstName: COPY,
    lastName: COPY,
    name: COPY,
    age: COPY,
    birthday: { convert: parseDate as ConvertFun },

    // CONTEXT FIELDS
    ipAddress: COPY,
    userAgent: COPY
    // pageUrl (unmapped)
    // pageTitle (unmapped)
  },
  unmappedFieldObject: ROOT
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  defaultSubscription: trackSignUpDefaultSubscription,
  platform: 'web',
  fields: trackSignUpFields,

  perform: (friendbuyAPI, { payload }) => {
    addName(payload)
    const friendbuyPayload = mapEvent(trackSignUpPub, payload as unknown as AnalyticsPayload)
    friendbuyAPI.push(['track', 'sign_up', friendbuyPayload, true])
  }
}

export default action
