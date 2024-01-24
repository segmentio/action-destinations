import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@segment/actions-shared'

import { createMapiRequest } from '../cloudUtil'
import { contextFields } from '@segment/actions-shared'
import { COPY, DROP, mapEvent } from '@segment/actions-shared'
import { trackCustomerFields } from '@segment/actions-shared'
import { enjoinInteger, enjoinString, parseDate } from '@segment/actions-shared'

const cloudTrackCustomerFields = { ...trackCustomerFields, ...contextFields }

const trackCustomerMapi: EventMap = {
  fields: {
    customerId: { convert: enjoinString as ConvertFun },
    // anonymousID (unmapped)
    email: COPY,
    isNewCustomer: COPY,
    loyaltyStatus: COPY,
    category: COPY,
    firstName: COPY,
    lastName: COPY,
    // name (unmapped)
    gender: COPY,
    age: { convert: enjoinInteger as ConvertFun },
    birthday: { convert: parseDate as ConvertFun },
    language: COPY,
    timezone: COPY,
    addressCountry: { name: 'country' },
    addressState: { name: 'state' },
    addressCity: { name: 'city' },
    addressPostalCode: { name: 'zipCode', convert: enjoinString as ConvertFun },

    // CONTEXT FIELDS
    ipAddress: COPY,
    userAgent: COPY,
    pageUrl: DROP,
    pageTitle: DROP
  },
  unmappedFieldObject: 'additionalProperties'
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Customer',
  description: 'Create a new customer profile or update an existing customer profile.',
  fields: cloudTrackCustomerFields,

  perform: async (request, { settings, payload }) => {
    const friendbuyPayload = mapEvent(trackCustomerMapi, payload as unknown as AnalyticsPayload)
    const [requestUrl, requestParams] = await createMapiRequest('v1/customer', request, settings, friendbuyPayload)
    return request(requestUrl, requestParams)
  }
}

export default action
