import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { EventMap } from '@segment/actions-shared'
import { FRIENDBUY_MAPI_VERSION } from '../../versioning-info'

import { createMapiRequest } from '../cloudUtil'
import { contextFields } from '@segment/actions-shared'
import { AnalyticsPayload, COPY, DROP, mapEvent } from '@segment/actions-shared'
import { trackCustomEventFields } from '@segment/actions-shared'
import { moveEventPropertiesToRoot } from '@segment/actions-shared'

const cloudTrackCustomEventFields = { ...trackCustomEventFields({ requireEmail: true }), ...contextFields }

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
    userAgent: COPY,
    pageUrl: DROP,
    pageTitle: DROP
  },
  unmappedFieldObject: 'additionalProperties'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Custom Event',
  description: 'Record when a customer completes any custom event that you define.',
  fields: cloudTrackCustomEventFields,

  perform: async (request, { settings, payload }) => {
    const payload1 = moveEventPropertiesToRoot(payload as unknown as AnalyticsPayload)
    const friendbuyPayload = mapEvent(trackCustomEventMapi, payload1)
    const [requestUrl, requestParams] = await createMapiRequest(`${FRIENDBUY_MAPI_VERSION}/event/custom`, request, settings, friendbuyPayload)
    return request(requestUrl, requestParams)
  }
}

export default action
