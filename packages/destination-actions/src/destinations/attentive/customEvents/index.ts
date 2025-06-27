import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { userIdentifiers, occurredAt, externalEventId, type, properties } from '../fields'
import { API_URL, API_VERSION } from '../constants'
import { formatCustomEventJSON, validate } from '../functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Events',
  description: 'Send custom Segment analytics events to Attentive.',
  defaultSubscription: 'type = "track" and event != "Product Viewed" and event != "Product Added" and event != "Order Completed"',
  fields: {
    userIdentifiers,
    occurredAt,
    externalEventId,
    type,
    properties
  },
  perform: (request, { payload }) => {
    validate(payload)
    return request(`${API_URL}/${API_VERSION}/events/custom`, {
      method: 'post',
      json: formatCustomEventJSON(payload)    
    })
  }
}

export default action
