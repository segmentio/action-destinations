import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getEventsUrl, parseTimestamp } from '../utils'
import type { Payload } from './generated-types'

type ContextKeys = {
  [kind: string]: string
}

type LDCustomEvent = {
  kind: 'custom'
  key: string
  contextKeys: ContextKeys
  metricValue?: number
  data: { [k: string]: unknown }
  creationDate: number
}

const constructContextKeys = (payload: Payload): ContextKeys => {
  const baseContextKeys = { [payload.context_kind || 'user']: payload.user_key }
  if (!payload.additional_context_keys) {
    return baseContextKeys
  }
  const coercedContextKeys: ContextKeys = {}
  Object.entries(payload.additional_context_keys).forEach(([k, v]) => {
    coercedContextKeys[k] = String(v)
  })
  return { ...coercedContextKeys, ...baseContextKeys }
}

const convertPayloadToLDEvent = (payload: Payload): LDCustomEvent => {
  return {
    kind: 'custom',
    key: payload.event_name,
    contextKeys: constructContextKeys(payload),
    creationDate: parseTimestamp(payload.timestamp),
    metricValue: payload.metric_value,
    data: payload.event_properties || {}
  }
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track custom events for use in A/B tests and experimentation.',
  defaultSubscription: 'type = "track"',
  fields: {
    context_kind: {
      label: 'Context Kind',
      type: 'string',
      required: false,
      description:
        "The event's context kind. If not specified, the context kind will default to `user`. To learn more about context kinds and where you can find a list of context kinds LaunchDarkly has observed, read [Context kinds](https://docs.launchdarkly.com/home/contexts/context-kinds).",
      default: 'user'
    },
    user_key: {
      label: 'Context Key',
      type: 'string',
      required: true,
      description: 'The unique LaunchDarkly context key. In most cases the Segment `userId` should be used.',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    additional_context_keys: {
      label: 'Additional Context Keys',
      type: 'object',
      required: false,
      description:
        'A mapping of additional context kinds to context keys. To learn more, read [Contexts and segments](https://docs.launchdarkly.com/home/contexts).',
      default: {
        unauthenticatedUser: { '@path': '$.anonymousId' }
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
      description: 'The time when the event happened. Defaults to the current time.',
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
