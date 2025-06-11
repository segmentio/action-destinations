import type { ActionDefinition, RequestClient } from '@segment/actions-core'
import { BatchEvent } from 'src/destinations/posthog/event/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description:
    'Track a single event in Posthog. Every event request must contain an `api_key`, `distinct_id`, and `event` field with the name. Both the `properties` and `timestamp` fields are optional.',
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
      required: false,
      default: {
        '@path': '$.properties'
      }
    },
    anonymous_event_capture: {
      label: 'Anonymous Event Capture',
      description:
        'To capture [anonymous events](https://posthog.com/docs/data/anonymous-vs-identified-events), set this field to `true`',
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
      description: 'If enabled, this action will be batched and processed in bulk.',
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
  const batch: BatchEvent[] = payload.map((payload) => ({
    event: payload.event_name,
    timestamp: payload.timestamp,
    properties: {
      ...payload.properties,
      distinct_id: payload.distinct_id,
      $process_person_profile: payload.anonymous_event_capture
    }
  }))
  return request(url, {
    method: 'post',
    headers,
    body: JSON.stringify({
      api_key: settings.api_key,
      historical_migration: settings.historical_migration,
      batch
    })
  })
}

export default action
