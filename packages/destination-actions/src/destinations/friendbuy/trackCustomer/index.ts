import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { AnalyticsPayload, ConvertFun, EventMap } from '@friendbuy/shared/mapEvent'

import { createRequestParams, mapiUrl } from '../cloudUtil'
import { contextFields } from '@friendbuy/shared/contextFields'
import { COPY, DROP, mapEvent } from '@friendbuy/shared/mapEvent'
import { trackCustomerFields } from '@friendbuy/shared/sharedCustomer'
import { parseDate } from '@friendbuy/shared/util'

const trackCustomerMapi: EventMap = {
  fields: {
    customerId: COPY,
    // anonymousID (unmapped)
    email: COPY,
    isNewCustomer: COPY,
    loyaltyStatus: COPY,
    category: COPY,
    firstName: COPY,
    lastName: COPY,
    // name (unmapped)
    gender: COPY,
    age: COPY,
    birthday: { convert: parseDate as ConvertFun },
    language: COPY,
    timezone: COPY,
    addressCountry: { name: 'country' },
    addressState: { name: 'state' },
    addressCity: { name: 'city' },
    addressPostalCode: { name: 'zipCode' },

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
  fields: Object.assign({}, trackCustomerFields, contextFields),

  perform: async (request, { settings, payload }) => {
    const friendbuyPayload = mapEvent(trackCustomerMapi, payload as unknown as AnalyticsPayload)

    if (!friendbuyPayload) {
      return undefined
    }

    const requestParams = await createRequestParams(request, settings, friendbuyPayload)
    return request(`${mapiUrl}/v1/customer`, requestParams)
  }
}

export default action
