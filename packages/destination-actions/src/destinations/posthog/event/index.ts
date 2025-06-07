import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track a single event in Posthog',
  defaultSubscription: 'type = "track" and event != "Order Completed"',
  fields: {
    event_name: {
      label: 'Event Name',
      description: 'The name of the event to track',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: true
    },
    distinct_id: {
      label: 'Distinct ID',
      description: 'The distinct ID of the user',
      type: 'string',
      default: {
        '@path': '$.userId'
      },
      required: true
    },
    properties: {
      label: 'Properties',
      description: 'The properties of the event',
      type: 'object',
      required: true,
      default: {
        '@path': '$.properties'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event',
      type: 'datetime',
      default: {
        '@path': '$.receivedAt'
      },
      required: false
    }
  },
  perform: (request, data) => {
    const url = `${data.settings.endpoint}/i/v0/e/`
    const headers = {
      'Content-Type': 'application/json'
    }
    const payload = {
      api_key: data.settings.api_key,
      event: data.payload.event_name,
      distinct_id: data.payload.distinct_id,
      properties: data.payload.properties,
      timestamp: data.payload.timestamp
    }
    return request(url, {
      method: 'post',
      headers,
      body: JSON.stringify(payload)
    })
  }
}

export default action
