import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL, formatTimestampAsUnixSeconds } from '../index'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Event',
  description: 'Send a custom event to Actable for prediction. Use this to supply events that are not in Actable \'s customer view.',
  fields: {
    customer_id: {
      label: 'Customer ID',
      description: 'The unique user identifier.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.userId'
      }
    },
    timestamp: {
      type: "datetime",
      label: "Timestamp of Event",
      description: "Timestamp of when the custom event occured.",
      format: 'date-time',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    properties: {
      type: "object",
      label: "Custom Properties",
      description: "Send an object of custom properties to Actable Predictive for custom data modeling.",
      format: "text",
      required: true,
      default: { '@path': '$.properties' }

    },
    stream_key: {
      type: "string",
      format: "text",
      label: "Stream Key",
      description: "Dataset label, should be left as default unless specified otherwise.",
      required: true,
      default: "custom"
    }
  },
  perform: (request, data) => {
    data.payload.timestamp = formatTimestampAsUnixSeconds(data.payload.timestamp)

    return request(API_URL, {
      method: 'post',
      json: { data: [data.payload] }
    })
  },
  performBatch: (request, data) => {
    for (const ev of data.payload) {
      ev.timestamp = formatTimestampAsUnixSeconds(ev.timestamp)
    }
    return request(API_URL, {
      method: 'post',
      json: { data: data.payload }
    })
  }
}

export default action
