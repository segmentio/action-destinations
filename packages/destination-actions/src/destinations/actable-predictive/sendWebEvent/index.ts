import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL, formatTimestampAsUnixSeconds } from '../index'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Web Activity Event',
  description: 'Send a Web (or app) event to Actable for prediction. Use this to supply events like page views, link clicks, etc.',
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
    datetime: {
      type: "datetime",
      format: "date-time",
      label: "Event Timestamp",
      description: "Timestamp of event",
      required: true,
      default: { '@path': '$.timestamp' }
    },
    interaction_type: {
      type: "string",
      format: "text",
      label: "Event Type",
      description: "type of interaction (page view, add to cart, etc).",
      required: true,
      default: { '@path': '$.event' }

    },
    utm_campaign: {
      type: "string",
      format: "text",
      label: "UTM Campaign",
      description: "UTM campaign parameter associated with event.",
      required: false,
      default: { '@path': '$.context.campaign.name' }
    },
    utm_medium: {
      type: "string",
      format: "text",
      label: "UTM Medium",
      description: "UTM medium parameter associated with event.",
      required: false,
      default: { '@path': '$.context.campaign.medium' }
    },
    utm_source: {
      type: "string",
      format: "text",
      label: "UTM Source",
      description: "UTM source parameter associated with event.",
      required: false,
      default: { '@path': '$.context.campaign.source' }
    },
    stream_key: {
      type: "string",
      format: "text",
      label: "Stream Key",
      description: "Dataset label, should be left as default unless directed otherwise",
      required: true,
      default: "web"
    }
  },
  perform: (request, data) => {
    data.payload.datetime = formatTimestampAsUnixSeconds(data.payload.datetime)

    return request(API_URL, {
      method: 'post',
      json: { data: [data.payload] }
    })
  },
  performBatch: (request, data) => {
    for (const ev of data.payload) {
      ev.datetime = formatTimestampAsUnixSeconds(ev.datetime)
    }
    return request(API_URL, {
      method: 'post',
      json: { data: data.payload }
    })
  }
}

export default action
