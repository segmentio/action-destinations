import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { eventType, items, occurredAt, userIdentifiers } from '../fields'
import { API_URL, API_VERSION } from '../config'
import { formatEcommObject } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send Segment ecommerce events to Attentive.',
  defaultSubscription: 'event = "Product Viewed" or event = "Product Added" or event = "Order Completed"',
  fields: {
    eventType,
    items,
    userIdentifiers,
    occurredAt
  },
  perform: (request, { payload }) => {
    const {
      userIdentifiers: { phone, email, clientUserId, ...customIdentifiers }
    } = payload

    if (!email && !phone && !clientUserId && Object.keys(customIdentifiers).length === 0) {
      throw new PayloadValidationError('At least one user identifier is required.')
    }

    return request(`${API_URL}/${API_VERSION}/events/ecommerce/${eventType}`, {
      method: 'POST',
      json: formatEcommObject(payload)
    })
  }
}

export default action
