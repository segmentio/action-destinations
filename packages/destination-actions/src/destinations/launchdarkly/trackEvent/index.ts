import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getEventsUrl, parseTimestamp } from '../utils'
import type { Payload } from './generated-types'

type LDCustomEvent = {
  kind: 'custom'
  key: string
  user: {
    key: string
  }
  metricValue?: number
  data: { [k: string]: unknown }
  creationDate: number
}

const convertPayloadToLDEvent = (payload: Payload): LDCustomEvent => {
  return {
    kind: 'custom',
    key: payload.event_name,
    user: {
      key: payload.user_key
    },
    creationDate: parseTimestamp(payload.timestamp),
    metricValue: payload.metric_value,
    data: payload.event_properties ? payload.event_properties : {}
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track custom user events for use in A/B tests and experimentation.',
  defaultSubscription: 'type = "track"',
  fields: {
    user_key: {
      label: 'User Key',
      type: 'string',
      required: true,
      description: "The user's unique key.",
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    event_name: {
      label: 'Event Name',
      type: 'string',
      description:
        'The name of the event to track. This name typically corresponds to a LaunchDarkly metric with the same key.',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    metric_value: {
      label: 'Metric Value',
      type: 'number',
      description:
        'The numeric value associated with the event. This value is used by the LaunchDarkly experimentation feature in numeric custom metrics, and will also be returned as part of the custom event for Data Export.',
      default: {
        '@if': {
          exists: { '@path': '$.properties.revenue' },
          then: { '@path': '$.properties.revenue' },
          else: { '@path': '$.properties.value' }
        }
      }
    },
    event_properties: {
      label: 'Event Properties',
      type: 'object',
      description:
        'Optional object containing the properties for the event being tracked. These properties assist with observational analytics for LaunchDarkly Data Export destinations. These properties are not saved to the LaunchDarkly user.',
      default: { '@path': '$.properties' }
    },
    timestamp: {
      label: 'Event timestamp',
      description: 'The time when the event happened. Defaults to the current time',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const event = convertPayloadToLDEvent(payload)
    return request(getEventsUrl(settings.client_id), {
      method: 'post',
      json: [event]
    })
  }
}

export default action
