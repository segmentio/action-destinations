import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userIdentifiers, occurredAt, eventType, items } from '../fields'
import { API_URL, API_VERSION } from '../constants'
import { formatEcommEventJSON, validate } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Purchase',
  description: 'Send Segment ecommerce events to Attentive.',
  defaultSubscription: 'event = "Product Viewed" or event = "Product Added" or event = "Order Completed"',
  fields: {
    userIdentifiers,
    occurredAt,
    eventType,
    items
  },
  perform: (request, { payload }) => {
    validate(payload)
    return request(`${API_URL}/${API_VERSION}/events/ecommerce/${eventType}`, {
      method: 'POST',
      json: formatEcommEventJSON(payload)
    })
  }
}

export default action
