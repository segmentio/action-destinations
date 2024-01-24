import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'

import type { FriendbuyAPI } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { ConvertFun, EventMap } from '@segment/actions-shared'

import { AnalyticsPayload, COPY, DROP, ROOT, mapEvent } from '@segment/actions-shared'
import { trackCustomEventFields } from '@segment/actions-shared'
import { addName, enjoinInteger, enjoinString, moveEventPropertiesToRoot, parseDate } from '@segment/actions-shared'

export const browserTrackCustomEventFields = trackCustomEventFields({}) // @@ email required?

const trackCustomEventPub: EventMap = {
  fields: {
    eventType: DROP,
    deduplicationId: COPY,

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
    birthday: { name: ['customer', 'birthday'], convert: parseDate as ConvertFun }
  },
  unmappedFieldObject: ROOT
}

const action: BrowserActionDefinition<Settings, FriendbuyAPI, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event that you define.',
  // trackCustomEvent has no default subscription.
  platform: 'web',
  fields: browserTrackCustomEventFields,

  perform: (friendbuyAPI, { payload }) => {
    const analyticsPayload = moveEventPropertiesToRoot(payload as unknown as AnalyticsPayload)
    addName(analyticsPayload)
    const friendbuyPayload = mapEvent(trackCustomEventPub, analyticsPayload)
    friendbuyAPI.push(['track', payload.eventType, friendbuyPayload])
  }
}

export default action
