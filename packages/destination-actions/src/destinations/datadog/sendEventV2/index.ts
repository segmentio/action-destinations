import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Event V2',
  description:
    'Post a structured event to Datadog Event Management. Supports "alert" events (for monitoring/alerting) and "change" events (for deployments, feature flag changes, and configuration updates).',

  defaultSubscription: 'type = "track"',

  fields: {
    title: {
      label: 'Event Title',
      description: 'The event title displayed in Datadog Event Management (1–500 characters).',
      type: 'string',
      required: true,
      default: { '@path': '$.event' }
    },
    category: {
      label: 'Event Category',
      description:
        'The category of the event. Use "alert" for monitoring and alerting events. Use "change" for configuration changes, deployments, or feature flag updates.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Alert', value: 'alert' },
        { label: 'Change', value: 'change' }
      ]
    },
    message: {
      label: 'Message',
      description: 'Free-form text body for the event (1–4000 characters). Supports markdown.',
      type: 'string',
      required: false
    },
    aggregationKey: {
      label: 'Aggregation Key',
      description:
        'An arbitrary key used to correlate related events in Datadog (1–100 characters). Events with the same aggregation key are grouped together.',
      type: 'string',
      required: false,
      default: { '@path': '$.userId' }
    },
    host: {
      label: 'Host',
      description: 'Hostname to associate with the event (1–255 characters).',
      type: 'string',
      required: false,
      default: { '@path': '$.context.ip' }
    },
    tags: {
      label: 'Tags',
      description:
        'List of tags to attach to the event in "key:value" format (e.g. "env:prod", "team:backend"). Maximum 100 tags, each up to 200 characters.',
      type: 'string',
      multiple: true,
      required: false
    },
    timestamp: {
      label: 'Timestamp',
      description:
        'ISO 8601 timestamp of when the event occurred. Must be no more than 18 hours in the past. If omitted, the current time is used.',
      type: 'datetime',
      required: false,
      default: { '@path': '$.timestamp' }
    },
    // Alert category fields
    alertStatus: {
      label: 'Alert Status',
      description:
        'The severity status of the alert. Required when Event Category is "alert". Ignored for "change" events.',
      type: 'string',
      required: false,
      choices: [
        { label: 'OK', value: 'ok' },
        { label: 'Warning', value: 'warn' },
        { label: 'Error', value: 'error' }
      ]
    },
    alertPriority: {
      label: 'Alert Priority',
      description:
        'Priority level for alert events (1 = highest, 5 = lowest). Only applies when Event Category is "alert".',
      type: 'string',
      required: false,
      choices: [
        { label: '1 (Highest)', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5 (Lowest)', value: '5' }
      ]
    },
    customAttributes: {
      label: 'Custom Attributes',
      description:
        "Arbitrary JSON key-value data for alert events. Maps to Datadog's attributes.custom field. Maximum 100 properties, up to 10 nesting levels.",
      type: 'object',
      required: false,
      default: { '@path': '$.properties' }
    },
    // Change category fields
    changedResourceName: {
      label: 'Changed Resource Name',
      description: 'The name of the resource that was changed. Required when Event Category is "change".',
      type: 'string',
      required: false
    },
    changedResourceType: {
      label: 'Changed Resource Type',
      description: 'The type of the changed resource. Required when Event Category is "change".',
      type: 'string',
      required: false,
      choices: [
        { label: 'Feature Flag', value: 'feature_flag' },
        { label: 'Configuration', value: 'configuration' }
      ]
    }
  },

  perform: (request, { payload, settings }) => {
    const site = settings.site || 'datadoghq.com'
    const baseUrl = `https://event-management-intake.${site}`

    // Build category-specific attributes
    // TODO: Validate that required category-specific fields are present before sending
    let categoryAttributes: Record<string, unknown>

    if (payload.category === 'change') {
      // Change events require changed_resource with name and type
      categoryAttributes = {
        changed_resource: {
          name: payload.changedResourceName,
          type: payload.changedResourceType
        }
      }
    } else {
      // Alert events require status; custom is optional free-form JSON
      categoryAttributes = {
        status: payload.alertStatus || 'ok',
        ...(payload.alertPriority && { priority: payload.alertPriority }),
        ...(payload.customAttributes && { custom: payload.customAttributes })
      }
    }

    // Normalize timestamp to ISO 8601 string
    // Datadog V2 events require ISO 8601 format (not epoch seconds)
    let timestampISO: string | undefined
    if (payload.timestamp) {
      const ts = typeof payload.timestamp === 'number' ? payload.timestamp : Date.parse(payload.timestamp)
      timestampISO = new Date(ts).toISOString()
    }

    return request(`${baseUrl}/api/v2/events`, {
      method: 'POST',
      json: {
        data: {
          type: 'event',
          attributes: {
            title: payload.title,
            category: payload.category,
            integration_id: 'custom-events',
            ...(payload.message && { message: payload.message }),
            ...(payload.aggregationKey && { aggregation_key: payload.aggregationKey }),
            ...(payload.host && { host: payload.host }),
            ...(payload.tags && payload.tags.length > 0 && { tags: payload.tags }),
            ...(timestampISO && { timestamp: timestampISO }),
            attributes: categoryAttributes
          }
        }
      }
    })
  }
}

export default action
