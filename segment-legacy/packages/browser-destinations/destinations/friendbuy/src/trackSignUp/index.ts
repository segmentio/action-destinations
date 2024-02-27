import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { COPY, ROOT, mapEvent } from '@segment/actions-shared'
import { trackSignUpFields } from '@segment/actions-shared'
import { addName, enjoinInteger, enjoinString, parseDate } from '@segment/actions-shared'

export const browserTrackSignUpFields = trackSignUpFields({ requireCustomerId: true, requireEmail: true })

// see https://segment.com/docs/config-api/fql/
export const trackSignUpDefaultSubscription = 'event = "Signed Up"'

const trackSignUpPub: EventMap = {
  fields: {
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,

    // CUSTOMER FIELDS
    customerId: { name: 'id', convert: enjoinString as ConvertFun },
    anonymousID: COPY,
    isNewCustomer: COPY,
    loyaltyStatus: COPY,
    email: COPY,
    firstName: COPY,
    lastName: COPY,
    name: COPY,
    age: { convert: enjoinInteger as ConvertFun },
    birthday: { convert: parseDate as ConvertFun }
  },
  unmappedFieldObject: ROOT
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Sign Up',
  description: 'Record when a customer signs up for a service.',
  defaultSubscription: trackSignUpDefaultSubscription,
  platform: 'web',
  fields: browserTrackSignUpFields,

  perform: (friendbuyAPI, { payload }) => {
    addName(payload)
    const friendbuyPayload = mapEvent(trackSignUpPub, payload as unknown as AnalyticsPayload)
    friendbuyAPI.push(['track', 'sign_up', friendbuyPayload, true])
  }
}

export default action
