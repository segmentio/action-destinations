import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { send, sendEventBatch } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track a single event in Altertable.',
  defaultSubscription: 'type = "track"',
  fields: {
    type: {
      label: 'Segment Event Type',
      description: 'The Segment event type',
      type: 'string',
      choices: [
        { label: 'track', value: 'track' },
        { label: 'page', value: 'page' },
        { label: 'screen', value: 'screen' }
      ],
      required: true,
      default: 'track'
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event to track. Only required for `track` event type.',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: {
        conditions: [
          {
            fieldKey: 'eventType',
            operator: 'is',
            value: 'track'
          }
        ]
      },
      depends_on: {
        conditions: [
          {
            fieldKey: 'eventType',
            operator: 'is',
            value: 'track'
          }
        ]
      }
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
    ...commonFields,
    enable_batching: {
      label: 'Enable Batching',
      type: 'boolean',
      required: true,
      default: true,
      unsafe_hidden: true,
      description: 'When enabled, events are sent in batches to Altertable.'
    },
    batch_size: {
      label: 'Batch Size',
      type: 'number',
      required: false,
      default: 1000,
      unsafe_hidden: true,
      description: 'Maximum number of events per batch request.'
    },
    batch_bytes: {
      label: 'Batch Bytes',
      type: 'number',
      required: false,
      default: 4000000,
      unsafe_hidden: true,
      description: 'Maximum batch payload size in bytes.'
    }
  },
  perform: (request, { settings, payload }) => {
    return send(request, settings, payload)
  },
  performBatch: (request, { settings, payload }) => {
    return sendEventBatch(request, settings, payload)
  }
}

export default action
