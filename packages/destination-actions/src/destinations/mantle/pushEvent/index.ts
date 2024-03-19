import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import { API_URL } from '../config'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Push Event',
  description: 'Push event to your app in Mantle',
  defaultSubscription: 'type = "track"',
  fields: {
    eventName: {
      label: 'Event Name',
      description: 'The name of the event you want to push to Mantle',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    eventId: {
      label: 'Event ID',
      description: 'The unique identifier for the event. This is used to deduplicate events in Mantle',
      type: 'string',
      required: false,
      default: { '@path': '$.messageId' }
    },
    customerId: {
      label: 'Customer ID',
      description:
        'The unique identifier for the customer. This is used to associate the event with a customer in Mantle. It can be the internal customer ID, API token, Shopify shop ID, or Shopify shop domain',
      type: 'string',
      required: true
    },
    properties: {
      label: 'Event Properties',
      description: 'The properties of the event. This is the extra data you want to attach to the event',
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    timestamp: {
      label: 'Event timestamp',
      description: 'The timestamp of the event, defaults to the current time',
      type: 'datetime',
      required: false,
      default: { '@path': '$.timestamp' }
    }
  },
  perform: (request, data) => {
    const payload = {
      event_name: data.payload.eventName,
      ...(data.payload.eventId ? { event_id: data.payload.eventId } : {}),
      customerId: data.payload.customerId,
      properties: data.payload.properties || {},
      ...(data.payload.timestamp ? { timestamp: data.payload.timestamp } : {})
    }
    return request(`${API_URL}/usage_events`, {
      method: 'post',
      json: payload
    })
  },
  performBatch: (request, data) => {
    const events = data.payload.map((payload) => ({
      event_name: payload.eventName,
      ...(payload.eventId ? { event_id: payload.eventId } : {}),
      customerId: payload.customerId,
      properties: payload.properties || {},
      ...(payload.timestamp ? { timestamp: payload.timestamp } : {})
    }))
    return request(`${API_URL}/usage_events`, {
      method: 'post',
      json: {
        events
      }
    })
  }
}

export default action
