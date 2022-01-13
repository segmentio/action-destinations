import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventMap } from '@segment/actions-shared'

import { createRequestParams, mapiUrl } from '../cloudUtil'
import { contextFields } from '@segment/actions-shared'
import { AnalyticsPayload, COPY, mapEvent } from '@segment/actions-shared'
import { trackCustomEventFields } from '@segment/actions-shared'
import { moveEventPropertiesToRoot } from '@segment/actions-shared'

const trackCustomEventMapi: EventMap = {
  fields: {
    eventType: COPY,
    deduplicationId: COPY,
    coupon: { name: 'couponCode' },
    attributionId: COPY,
    referralCode: COPY,

    // CUSTOMER FIELDS
    // customerId (unmapped)
    email: COPY,
    firstName: COPY,
    lastName: COPY,
    isNewCustomer: COPY,

    // CONTEXT FIELDS
    ipAddress: COPY,
    userAgent: COPY
    // pageUrl (unmapped)
    // pageTitle (unmapped)
  },
  unmappedFieldObject: 'additionalProperties'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event.',
  fields: Object.assign({}, trackCustomEventFields, contextFields),

  perform: async (request, { settings, payload }) => {
    const payload1 = moveEventPropertiesToRoot(payload as unknown as AnalyticsPayload)
    const friendbuyPayload = mapEvent(trackCustomEventMapi, payload1)
    const requestParams = await createRequestParams(request, settings, friendbuyPayload)
    return request(`${mapiUrl}/v1/event/custom`, requestParams)
  }
}

export default action
