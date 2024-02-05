import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { convertValidTimestamp, trackApiEndpoint } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Delivery Event',
  description: 'Report delivery metrics for a message sent from the Customer.io Journeys product.',
  defaultSubscription: 'event = "Report Delivery Event"',
  fields: {
    delivery_id: {
      label: 'Delivery ID',
      description: 'The CIO-Delivery-ID from the message that you want to associate the metric with.',
      type: 'string',
      default: {
        '@path': '$.properties.deliveryId'
      },
      required: true
    },
    metric: {
      label: 'Metric',
      description: `The metric you want to report back to Customer.io. Not all metrics are available for all channels. Please refer to the [documentation](https://customer.io/docs/api/track/#operation/metrics) for more information.`,
      type: 'string',
      default: {
        '@path': '$.properties.metric'
      },
      required: true,
      choices: [
        { label: 'Delivered', value: 'delivered' },
        { label: 'Opened', value: 'opened' },
        { label: 'Clicked', value: 'clicked' },
        { label: 'Converted', value: 'converted' },
        { label: 'Marked as Spam', value: 'spammed' },
        { label: 'Bounced', value: 'bounced' },
        { label: 'Suppressed', value: 'dropped' },
        { label: 'Deferred', value: 'deferred' }
      ]
    },
    recipient: {
      label: 'Recipient',
      description: `Information about who the message was delivered to. For email, SMS and mobile push this is the email address, phone number and device token, respectively.`,
      type: 'string',
      default: {
        '@path': '$.properties.recipient'
      }
    },
    reason: {
      label: 'Reason',
      description: 'For metrics indicating a failure, this field provides information for the failure.',
      type: 'string',
      default: {
        '@path': '$.properties.reason'
      }
    },
    href: {
      label: 'Href',
      description: 'For click metrics, this is the link that was clicked.',
      type: 'string',
      default: {
        '@path': '$.properties.href'
      }
    },
    action_name: {
      label: 'Action Name',
      description: 'For In-App messages, this is the name of the action that was clicked.',
      type: 'string',
      default: {
        '@path': '$.properties.actionName'
      }
    },
    action_value: {
      label: 'Action Value',
      description: 'For In-App messages, this is the value of the action that was clicked.',
      type: 'string',
      default: {
        '@path': '$.properties.actionValue'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'A timestamp of when the metric event took place. Default is when the event was triggered.',
      type: 'datetime',
      format: 'date-time',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const metricsRequest: MetricsV1Payload = {
      delivery_id: payload.delivery_id,
      metric: payload.metric,
      timestamp: Math.floor(Date.now() / 1000)
    }

    const unix_timestamp = Number(convertValidTimestamp(payload.timestamp))
    if (!isNaN(unix_timestamp)) {
      metricsRequest.timestamp = unix_timestamp
    }

    if (payload.recipient) {
      metricsRequest.recipient = payload.recipient
    }

    if (payload.reason) {
      metricsRequest.reason = payload.reason
    }

    if (payload.href) {
      metricsRequest.href = payload.href
    }

    if (payload.action_name) {
      metricsRequest.metadata = metricsRequest.metadata || {}
      metricsRequest.metadata.action_name = payload.action_name
    }
    if (payload.action_value) {
      metricsRequest.metadata = metricsRequest.metadata || {}
      metricsRequest.metadata.action_value = payload.action_value
    }

    return request(trackApiEndpoint(settings) + '/api/v1/metrics', {
      json: metricsRequest,
      method: 'post'
    })
  }
}

interface MetricsV1Payload {
  // common fields
  delivery_id: string
  metric: string
  timestamp: number
  // optional fields
  recipient?: string
  // optional fields for message clicks
  href?: string
  // optional fields for failures
  reason?: string
  // optional fields for in-app clicks
  metadata?: {
    action_name?: string
    action_value?: string
  }
}

export default action
