import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { BatchJSON } from '../types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Track a single event in Posthog. Every event request must contain an `api_key`, `distinct_id`, and `event` field with the name. Both the `properties` and `timestamp` fields are optional.',
  defaultSubscription: 'type = "track"',
  fields: {
    event_type: {
      label: 'Event Type',
      description:
        'For regular analytics events, use `track`. For page views, use `page`. For mobile screens, use `screen`.',
      type: 'string',
      choices: [
        { label: 'track', value: 'track' },
        { label: 'page', value: 'page' },
        { label: 'screen', value: 'screen' }
      ],
      required: true,
      default: 'track',
      unsafe_hidden: true
    },
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
      required: false,
      default: {
        '@path': '$.properties'
      }
    },
    current_url: {
      label: 'Current URL',
      description: 'The current URL of the page being viewed. Only required for page events.',
      type: 'string',
      default: {
        '@path': '$.context.page.url'
      },
      required: {
        conditions: [{ fieldKey: 'event_type', operator: 'is', value: 'page' }]
      },
      depends_on: {
        conditions: [
          {
            fieldKey: 'event_type',
            operator: 'is',
            value: 'page'
          }
        ]
      }
    },
    screen_name: {
      label: 'Screen Name',
      description: 'The name of the mobile screen being viewed. Only required for screen events.',
      type: 'string',
      default: {
        '@path': '$.name'
      },
      required: {
        conditions: [{ fieldKey: 'event_type', operator: 'is', value: 'screen' }]
      },
      depends_on: {
        conditions: [
          {
            fieldKey: 'event_type',
            operator: 'is',
            value: 'screen'
          }
        ]
      }
    },
    anonymous_event_capture: {
      label: 'Anonymous Event Capture',
      description:
        'To capture this event as an [anonymous event](https://posthog.com/docs/data/anonymous-vs-identified-events), set this field to `true`',
      type: 'boolean',
      default: false,
      required: true
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event',
      type: 'datetime',
      default: {
        '@path': '$.receivedAt'
      },
      required: false
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'If enabled, event may be batched and send in bulk to Posthog.',
      type: 'boolean',
      default: false,
      required: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of events to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 100,
      unsafe_hidden: true
    }
  },
  perform: (request, { settings, payload }) => {
    return send(request, settings, [payload])
  },
  performBatch: (request, { settings, payload }) => {
    return send(request, settings, payload)
  }
}

function send(request: RequestClient, settings: Settings, payload: Payload[]) {
  const url = `${settings.endpoint}/batch/`
  const headers = {
    'Content-Type': 'application/json'
  }

  const json: BatchJSON = {
    api_key: settings.api_key,
    historical_migration: settings.historical_migration,
    batch: payload.map((payload) => ({
      event:
        payload.event_type === 'page' ? '$pageview' : payload.event_type === 'screen' ? '$screen' : payload.event_name,
      timestamp: payload.timestamp,
      properties: {
        ...payload.properties,
        $current_url: payload.event_type === 'page' ? payload.current_url : undefined,
        $screen_name: payload.event_type === 'screen' ? payload.screen_name : undefined,
        distinct_id: payload.distinct_id,
        $process_person_profile: payload.anonymous_event_capture
      }
    }))
  }

  return request(url, {
    method: 'post',
    headers,
    json
  })
}

export default action
