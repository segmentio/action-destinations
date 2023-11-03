import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { API_URL, formatTimestampAsUnixSeconds } from '../index'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Email Event',
  description: 'Send an email event to Actable for prediction. Use this to supply clicks, opens, and unsubscribes.',
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
    date_email_sent: {
      type: "datetime",
      label: "timestamp of event",
      description: "Timestamp of event",
      format: 'date-time',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    campaign_name: {
      type: "string",
      label: "Campaign Name of Email",
      description: "name of the campaign associated with the email",
      format: 'text',
      required: false,
      default: {
        '@path': '$.context.campaign.name'
      }

    },
    clicked_flag: {
      type: "integer",
      label: "Click Event Indicator",
      description: "1=email was clicked, 0 email was not clicked",
      format: 'text',
      required: false
    },
    opened_flag: {
      type: "integer",
      label: "Open Event Indicator",
      description: "1=email was opened, 0 email was not opened",
      format: 'text',
      required: false
    },
    unsub_flag: {
      type: "integer",
      label: "Unsubscribe Event Indicator",
      description: "1=customer unsubscribed from the email list, 0 user remained subscribed",
      format: 'text',
      required: false
    },
    stream_key: {
      type: "string",
      format: "text",
      label: "Stream Key",
      description: "Dataset label, should be left as default unless directed otherwise",
      required: true,
      default: "email"
    }
  },
  perform: (request, data) => {
    data.payload.date_email_sent = formatTimestampAsUnixSeconds(data.payload.date_email_sent)

    return request(API_URL, {
      method: 'post',
      json: { data: [data.payload] }
    })
  },
  performBatch: (request, data) => {
    for (const ev of data.payload) {
      ev.date_email_sent = formatTimestampAsUnixSeconds(ev.date_email_sent)
    }
    return request(API_URL, {
      method: 'post',
      json: { data: data.payload }
    })
  }
}

export default action
